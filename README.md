
# react-fetchy

[![Build Status](https://travis-ci.org/LoicMahieu/react-fetchy.svg?branch=master)](https://travis-ci.org/LoicMahieu/react-fetchy)
[![npm](https://img.shields.io/npm/v/react-fetchy.svg)](https://www.npmjs.com/package/react-fetchy)

react-fetchy is a React component that let makes fetch call easily by using "Function as Child components" pattern. Built on top of [`superagent`](http://visionmedia.github.io/superagent/).

### Example

#### Single

##### Fetch on mount

```js
import { Fetchy } from "react-fetchy";

const PostList = () => (
  <Fetchy url="https://jsonplaceholder.typicode.com/todos">
    {({ fetch, state: { value: todos } }) => (
      <div>
        <h1>Todos</h1>
        <button onClick={fetch}>Refresh</button>
        <ul>
          {(todos || []).map(todo => <li key={todo.id}>{todo.title}</li>)}
        </ul>
      </div>
    )}
  </Fetchy>
);
```

See [CodeSandbox](https://codesandbox.io/s/pjrrk8nqrx)

##### Manual fetch

```js
const PostList = () => (
  <Fetchy>
    {({ fetch, state: { value: todos } }) => (
      <button onClick={e => {
        fetch({
          url: "https://jsonplaceholder.typicode.com/todos",
        });
      }}>Fetch me</button>
    )}
  </Fetchy>
);
```

##### Options

See [`interface IFetchyRequestOptions`](./src/Fetchy.tsx#L19-L30)

#### Multi

##### Fetch on mount

```js
import { FetchyMulti } from "react-fetchy";

const PostList = () => (
  <FetchyMulti
    requests={[
      { id: "1", url: "https://jsonplaceholder.typicode.com/todos/1" },
      { id: "2", url: "https://jsonplaceholder.typicode.com/todos/2" },
      { id: "3", url: "https://jsonplaceholder.typicode.com/todos/3" }
    ]}
  >
    {({ states }) => <pre>{JSON.stringify(states, null, 2)}</pre>}
  </FetchyMulti>
);
```

See [CodeSandbox](https://codesandbox.io/s/n500mq8k1j)

##### Options

See [`interface IFetchyMultiOptions`](./src/FetchyMulti.tsx#L25-L28)

## License

MIT
