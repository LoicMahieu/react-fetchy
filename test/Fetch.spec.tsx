import { configure, shallow } from "enzyme";
import Adapter from "enzyme-adapter-react-16";
import * as React from "react";

import { Fetchy, IFetchyRenderArgs } from "../src";
import { beforeRunHttpServer } from "./utils";

const base = "http://localhost:8080";

configure({ adapter: new Adapter() });

describe("Fetchy", () => {
  beforeRunHttpServer(8080);

  it("no render or children", () => {
    expect(() => shallow(<Fetchy />)).toThrow(
      "Missing children or render props",
    );
  });
  describe("basic", () => {
    it("render", () => {
      const render = jest.fn((bag: IFetchyRenderArgs) => {
        expect(bag).toMatchSnapshot();
      });
      shallow(<Fetchy render={render} />);
      expect(render).toHaveBeenCalled();
    });
    it("children", () => {
      const children = jest.fn((bag: IFetchyRenderArgs) => {
        expect(bag).toMatchSnapshot();
      });
      shallow(<Fetchy children={children} />);
      expect(children).toHaveBeenCalled();
    });
  });
  describe("fetch", () => {
    let bag;
    let el;
    beforeEach(() => {
      const render = jest.fn((iBag: IFetchyRenderArgs) => {
        bag = iBag;
      });
      el = <Fetchy render={render} />;
      shallow(el);
      expect(render).toHaveBeenCalled();
      expect(bag).toMatchSnapshot();
    });

    it("throw error if no url", async () => {
      expect.assertions(3);
      try {
        await bag.fetch();
      } catch (error) {
        expect(error).toMatchSnapshot();
      }
    });

    it("GET 200", async () => {
      expect(
        await bag.fetch({
          headers: {
            "Some-Header": "1",
          },
          query: "foo",
          retry: 5,
          then: value => ({
            ...value,
            newValue: 1,
          }),
          timeout: 20,
          url: `${base}/200`,
          withCredentials: true,
        }),
      ).toMatchSnapshot();
      expect(bag).toMatchSnapshot();
    });

    it("GET 404", async () => {
      expect.assertions(5);
      try {
        await bag.fetch({ url: `${base}/404` });
      } catch (e) {
        expect(e.data).toMatchSnapshot();
        expect(e).toMatchSnapshot();
      }
      expect(bag).toMatchSnapshot();
    });

    it("POST 200", async () => {
      expect(
        await bag.fetch({
          body: Buffer.from("hello world"),
          method: "post",
          url: `${base}/post/200`,
        }),
      ).toMatchSnapshot();
      expect(bag).toMatchSnapshot();
    });

    it("abort", async () => {
      const promise = bag.fetch({ url: `${base}/200?first` });
      expect(bag).toMatchSnapshot();
      await bag.fetch({ url: `${base}/200?second` });
      expect(bag).toMatchSnapshot();
    });

    it("invalid method", async () => {
      try {
        await bag.fetch({ url: `${base}`, method: "FOO" });
      } catch (error) {
        expect(error.message).toEqual("Invalid method FOO.");
      }
    });

    it("accept method with case", async () => {
      expect(
        await bag.fetch({
          method: "GET",
          url: `${base}/200`,
        }),
      ).toMatchSnapshot();
    });
  });
  describe("reset", () => {
    it("works", async () => {
      let bag;
      const render = jest.fn((iBag: IFetchyRenderArgs) => {
        bag = iBag;
      });
      const element = <Fetchy render={render} />;
      shallow(element);
      expect(bag).toMatchSnapshot();
      await bag.fetch({ url: `${base}/200` });
      expect(bag).toMatchSnapshot();
      await bag.reset();
      expect(bag).toMatchSnapshot();
    });
  });
  it("fetch on mount / unmount", async () => {
    let bag;
    const render = jest.fn((iBag: IFetchyRenderArgs) => {
      bag = iBag;
    });
    const element = <Fetchy render={render} url={`${base}/200`} />;
    const wrapper = shallow(element);
    expect(bag.state.pending).toEqual(true);
    wrapper.unmount();
  });
  it("unmount without any fetch", async () => {
    let bag;
    const render = jest.fn((iBag: IFetchyRenderArgs) => {
      bag = iBag;
    });
    const element = <Fetchy render={render} />;
    const wrapper = shallow(element);
    expect(bag.state.pending).toEqual(false);
    wrapper.unmount();
  });
  it("fetch on props change", async () => {
    let bag;
    const render = jest.fn((iBag: IFetchyRenderArgs) => {
      bag = iBag;
    });
    const wrapper = shallow(<Fetchy render={render} />);
    expect(bag.state.pending).toEqual(false);
    wrapper.setProps({ url: `${base}/200` });
    expect(bag.state.pending).toEqual(true);
    wrapper.unmount();
  });
});
