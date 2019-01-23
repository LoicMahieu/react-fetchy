import React from "react";
import FetchyMulti from "../../../lib/esm/FetchyMulti";

const createNewRequest = i => ({
  id: `todos-${i}`,
  url: `/api/200/${i}`,
});

class App extends React.Component {
  state = {
    requests: [],
  };

  addNew = () => {
    this.setState(state => ({
      requests: [...state.requests, createNewRequest(state.requests.length)],
    }));
  };

  remove = (request) => {
    this.setState(state => ({
      requests: state.requests.filter(req => req.id !== request.id),
    }));
  }

  render() {
    return (
      <div>
        <FetchyMulti requests={this.state.requests}>
          {bag => (
            <>
              <button onClick={() => bag.abort()}>Abort all</button>
              <button onClick={this.addNew}>Add new</button>

              <table>
                {this.state.requests.map((request, i) => (
                  <tr key={i}>
                    <td>{request.id}</td>
                    <td>
                      <button onClick={() => this.remove(request)}>Remove</button>
                    </td>
                  </tr>
                ))}
              </table>


              <pre>{JSON.stringify(this.state, null, 2)}</pre>
              <pre>
                {JSON.stringify(
                  Object.keys(bag.states).map(id => ({
                    id,
                    fulfilled: bag.states[id].fulfilled,
                    pending: bag.states[id].pending,
                    rejected: bag.states[id].rejected,
                  })),
                  null,
                  2,
                )}
              </pre>
            </>
          )}
        </FetchyMulti>
      </div>
    );
  }
}

export default App;
