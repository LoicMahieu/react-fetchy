import waitUntil from "async-wait-until";
import { configure, shallow } from "enzyme";
import Adapter from "enzyme-adapter-react-16";
import * as React from "react";

import { FetchyMulti, IFetchyMultiRenderArgs } from "../src";
import { beforeRunHttpServer, setup } from "./utils";

const base = "http://localhost:8081";

configure({ adapter: new Adapter() });

describe("FetchyMulti", () => {
  beforeRunHttpServer(8081);

  it("no render or children", () => {
    expect(() => shallow(<FetchyMulti />)).toThrow(
      "Missing children or render props",
    );
  });
  describe("basic", () => {
    it("render", () => {
      const render = jest.fn((bag: IFetchyMultiRenderArgs) => {
        expect(bag).toMatchSnapshot();
      });
      shallow(<FetchyMulti render={render} />);
      expect(render).toHaveBeenCalled();
    });
    it("children", () => {
      const children = jest.fn((bag: IFetchyMultiRenderArgs) => {
        expect(bag).toMatchSnapshot();
      });
      shallow(<FetchyMulti children={children} />);
      expect(children).toHaveBeenCalled();
    });
  });
  it("fetch on mount", async () => {
    const then = jest.fn();
    const res = setup(FetchyMulti, {
      requests: [
        {
          id: "1",

          headers: {
            "Some-Header": "1",
          },
          query: "foo",
          retry: 5,
          timeout: 20,
          url: `${base}/200`,
          withCredentials: true,

          then,
        },
        {
          id: "2",
          url: `${base}/200?delay=50`,
        },
      ],
    });
    expect(res.bag.states["1"].pending).toEqual(true);
    expect(res.bag.states["2"].pending).toEqual(true);

    await waitUntil(() => !res.bag.states["1"].pending);
    expect(res.bag.states["1"].fulfilled).toEqual(true);

    expect(then).toHaveBeenCalled();

    await waitUntil(() => !res.bag.states["2"].pending);
    expect(res.bag.states["2"].fulfilled).toEqual(true);

    expect(res.bag).toMatchSnapshot();
  });
  it("abort on unmount", async () => {
    const res = setup(FetchyMulti, {
      requests: [
        {
          id: "1",
          url: `${base}/200`,
        },
        {
          id: "2",
          url: `${base}/200?delay=100`,
        },
      ],
    });
    expect(res.bag.states["1"].pending).toEqual(true);
    expect(res.bag.states["2"].pending).toEqual(true);

    res.wrapper.unmount();

    expect(res.bag.states["1"].rejected).toEqual(true);
    expect(res.bag.states["2"].rejected).toEqual(true);
  });
  it("handle errors", async () => {
    const res = setup(FetchyMulti, {
      requests: [
        {
          id: "1",
          url: `${base}/500`,
        },
      ],
    });
    expect(res.bag.states["1"].pending).toEqual(true);
    await waitUntil(() => !res.bag.states["1"].pending);

    expect(res.bag.states["1"].fulfilled).toEqual(false);
    expect(res.bag.states["1"].rejected).toEqual(true);

    expect(res.bag).toMatchSnapshot();
  });
  it("handle errors and retry", async () => {
    const res = setup(FetchyMulti, {
      requests: [
        {
          id: "1",
          url: `${base}/500`,
        },
      ],
    });
    expect(res.bag.states["1"].pending).toEqual(true);
    await waitUntil(() => !res.bag.states["1"].pending);

    expect(res.bag.states["1"].fulfilled).toEqual(false);
    expect(res.bag.states["1"].rejected).toEqual(true);

    expect(res.bag).toMatchSnapshot();

    expect(() => res.bag.retry("123")).toThrowError(
      "Could not find request for id: 123",
    );

    res.bag.retry("1");
    expect(res.bag.states["1"].pending).toEqual(true);
  });
  it("abort on update", async () => {
    const res = setup(FetchyMulti, {
      requests: [
        {
          id: "1",
          url: `${base}/200`,
        },
        {
          id: "2",
          url: `${base}/200`,
        },
      ],
    });
    expect(res.bag.states["1"].pending).toEqual(true);
    expect(res.bag.states["2"].pending).toEqual(true);

    res.wrapper.setProps({
      requests: [
        {
          id: "2",
          url: `${base}/200`,
        },
        {
          id: "3",
          url: `${base}/200`,
        },
      ],
    });

    expect(res.bag.states["1"]).toBeUndefined();
    expect(res.bag.states["2"].pending).toEqual(true);
    expect(res.bag.states["3"].pending).toEqual(true);
  });
  it("abort not started requests", async () => {
    const res = setup(FetchyMulti, {
      requests: [
        {
          id: "1",
          url: `${base}/200`,
        },
        {
          id: "2",
          url: `${base}/200`,
        },
        {
          id: "3",
          url: `${base}/200?delay=100`,
        },
      ],
    });
    expect(res.bag.states["1"].pending).toEqual(true);
    expect(res.bag.states["2"].pending).toEqual(true);

    res.bag.abort("3");

    await waitUntil(() => !res.bag.states["1"].pending);
    await waitUntil(() => !res.bag.states["2"].pending);

    expect(res.bag.states["3"].pending).toEqual(false);
    expect(res.bag.states["3"].rejected).toEqual(true);
    expect(res.bag.states["3"].error).not.toBeUndefined()
  });
});
