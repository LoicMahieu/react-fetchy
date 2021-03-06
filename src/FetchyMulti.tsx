// throw error if no options.id
// check error on timeout

// TODOS:
// * Pause/resume

import * as React from "react";
import * as request from "superagent";
import { AbortError } from "./AbortError";
import {
  IFetchyRequestOptions,
  IFetchyState,
  IMethodType,
  initialState as singleInitialState,
} from "./Fetchy";

export interface IFetchyMultiState {
  [id: string]: IFetchyState | undefined;
}

export interface IFetchyMultiRequestOptions extends IFetchyRequestOptions {
  id: string;
}

export interface IFetchyMultiOptions {
  concurrency: number;
  requests: IFetchyMultiRequestOptions[];
}

export interface IFetchyMultiRenderArgs {
  states: {
    [id: string]: IFetchyState;
  };
  abort: (id?: string) => void;
  retry: (id: string) => void;
}

interface IFetchyMultiProps extends IFetchyMultiOptions {
  children?(bag: IFetchyMultiRenderArgs): React.ReactNode;
  render?(bag: IFetchyMultiRenderArgs): React.ReactNode;
}

const initialState: IFetchyMultiState = {};

export class FetchyMulti extends React.Component<
  IFetchyMultiProps,
  IFetchyMultiState
> {
  public static defaultProps: IFetchyMultiProps = {
    concurrency: 2,
    requests: [],
  };

  public readonly state: IFetchyMultiState = initialState;

  private superAgentRequests: {
    [id: string]: request.SuperAgentRequest;
  } = {};

  private mounted: boolean = true;

  public componentDidMount() {
    this.checkQueue();
  }

  public componentDidUpdate(previousProps: IFetchyMultiProps) {
    if (previousProps === this.props) {
      return;
    }

    // Clean state
    this.setState(
      state =>
        Object.keys(state).reduce((newState, id) => {
          const req = this.props.requests.find(r => r.id === id);
          return {
            ...newState,
            [id]: req ? state[id] : undefined,
          };
        }, {}),
      () => {
        // Abort running
        this.superAgentRequests = Object.keys(this.superAgentRequests).reduce(
          (newRequests, id) => {
            const req = this.props.requests.find(r => r.id === id);

            if (req) {
              return {
                ...newRequests,
                [id]: this.superAgentRequests[id],
              };
            } else {
              this.abort(id);
              return newRequests;
            }
          },
          {},
        );

        this.checkQueue();
      },
    );
  }

  public componentWillUnmount() {
    this.mounted = false;
    this.abort();
  }

  public render() {
    const render =
      typeof this.props.children === "function"
        ? this.props.children
        : this.props.render;

    if (!render) {
      throw new Error("Missing children or render props");
    }

    const bag: IFetchyMultiRenderArgs = {
      abort: this.abort,
      retry: this.retry,
      states: this.props.requests.reduce(
        (bagStates, req) => ({
          ...bagStates,
          [req.id]: this.state[req.id] || singleInitialState,
        }),
        {},
      ),
    };

    return render(bag);
  }

  private fetch = async (options: IFetchyMultiRequestOptions) => {
    if (this.superAgentRequests[options.id]) {
      this.superAgentRequests[options.id].abort();
      delete this.superAgentRequests[options.id];
    }

    const {
      url,
      method = "get",
      query,
      body,
      headers,
      then,
      timeout,
      retry,
      withCredentials,
    } = options;

    if (!url) {
      throw new Error("Parameter `url` is required.");
    }

    this.setState({
      [options.id]: {
        ...singleInitialState,
        fulfilled: false,
        pending: true,
      },
    });

    let response: any;

    // Create request
    const m = method.toLowerCase() as IMethodType;
    const createReq = request[m];
    if (!createReq) {
      throw new Error(`Invalid method ${method}.`);
    }
    const req = createReq(url);
    this.superAgentRequests[options.id] = req;

    if (headers) {
      req.set(headers);
    }
    if (query) {
      req.query(query);
    }
    if (body) {
      req.send(body);
    }
    if (timeout) {
      req.timeout(timeout);
    }
    if (retry) {
      req.retry(retry);
    }
    if (withCredentials) {
      req.withCredentials();
    }
    req.on("progress", progress => {
      this.setState(state => ({
        [options.id]: {
          ...(state[options.id] || singleInitialState),
          progress,
        },
      }));
    });
    req.on("response", incomingMessage => {
      response = incomingMessage;
    });

    try {
      // Wait response
      await req;

      if (!this.mounted) {
        return;
      }

      /* istanbul ignore if : should never happend */
      if (!response) {
        throw new Error("No response");
      }

      // Handle Result
      const value = response.body;
      const state: IFetchyState = {
        ...singleInitialState,
        fulfilled: true,
        result: response,
        value,
      };
      if (then) {
        Object.assign(state, then(state));
      }
      this.setState({
        [options.id]: state,
      });
    } catch (error) {
      error.data = error.data || {};
      error.data.result = {
        response,
      };

      this.setState({
        [options.id]: {
          error,
          fulfilled: false,
          pending: false,
          rejected: true,
          result: response,
          value: null,
        },
      });
    }
  };

  private async checkQueue() {
    const { concurrency } = this.props;
    const runningRequestCount = Object.keys(this.state).filter(id => {
      const state = this.state[id];
      return state ? state.pending : false;
    }).length;
    const availableCount = concurrency - runningRequestCount;
    const requestsTodo = this.props.requests.filter(req => {
      const runningRequest = this.superAgentRequests[req.id];

      if (this.state[req.id]) {
        return false;
      }

      if (runningRequest) {
        return false;
      }

      return true;
    });

    await Promise.all(
      requestsTodo.slice(0, availableCount).map(async req => {
        try {
          await this.fetch(req);
        } finally {
          this.checkQueue();
        }
      }),
    );
  }

  private abort = (id?: string) => {
    if (id) {
      if (this.superAgentRequests[id]) {
        this.superAgentRequests[id].abort();
      }
      this.setState({
        [id]: {
          error: new AbortError(),
          fulfilled: false,
          pending: false,
          rejected: true,
          result: undefined,
          value: null,
        },
      });
    } else {
      const ids = [
        ...Object.keys(this.superAgentRequests),
        ...this.props.requests.map(req => req.id),
      ];
      ids.map(i => {
        this.abort(i);
      });
    }
  };

  private retry = (id: string) => {
    const req = this.props.requests.find(r => r.id === id);
    if (!req) {
      throw new Error("Could not find request for id: " + id);
    }

    if (this.superAgentRequests[id]) {
      this.superAgentRequests[id].abort();
      delete this.superAgentRequests[id];
    }

    this.setState({
      [id]: undefined,
    });

    this.checkQueue();
  };
}
