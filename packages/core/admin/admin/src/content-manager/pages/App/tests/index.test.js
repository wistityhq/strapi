/* eslint-disable no-irregular-whitespace */
import React from 'react';
import { createStore, combineReducers } from 'redux';
import { Router } from 'react-router-dom';
import { createMemoryHistory } from 'history';
import { Provider } from 'react-redux';
import { render, screen } from '@testing-library/react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import ContentManagerApp from '..';
import cmReducers from '../../../../reducers';
import useModels from '../useModels';

jest.mock('../useModels', () =>
  jest.fn(() => {
    return {};
  })
);

jest.mock('react-intl', () => ({
  FormattedMessage: () => 'label',
  useIntl: () => ({ formatMessage: jest.fn(() => 'label') }),
}));
jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: () => null,
}));

jest.mock('../../NoContentType', () => () => <div>NoContentType</div>);

describe('Content manager | App | main', () => {
  beforeEach(() => {
    jest.resetModules(); // Most important - it clears the cache
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should not crash', () => {
    const contentManagerState = {
      collectionTypeLinks: [
        {
          uid: 'category',
          title: 'Categories',
          name: 'category',
          to: '/content-manager/collectionType/category',
          kind: 'collectionType',
          isDisplayed: true,
          permissions: [
            {
              action: 'plugins::content-manager.explorer.read',
              subject: 'category',
            },
          ],
        },
      ],
      singleTypeLinks: [
        {
          uid: 'homepage',
          title: 'Home page',
          name: 'homepage',
          to: '/homepage',
          kind: 'singleType',
          isDisplayed: true,
          permissions: [
            {
              action: 'plugins::content-manager.explorer.read',
              subject: 'homepage',
            },
          ],
        },
      ],
      models: [
        {
          kind: 'collectionType',
          uid: 'category',
          info: { label: 'Categories', name: 'category' },
        },
        { kind: 'singleType', uid: 'homepage', info: { label: 'Home page', name: 'homepage' } },
      ],
      components: [],
      status: 'resolved',
    };
    useModels.mockImplementation(() => contentManagerState);
    const rootReducer = combineReducers(cmReducers);
    const store = createStore(rootReducer, { 'content-manager_app': contentManagerState });
    const history = createMemoryHistory();
    history.push('/content-manager');

    const { container } = render(
      <DndProvider backend={HTML5Backend}>
        <Provider store={store}>
          <Router history={history}>
            <ContentManagerApp />
          </Router>
        </Provider>
      </DndProvider>
    );

    expect(screen.getByText('Home page')).toBeVisible();
    expect(screen.getByText('Categories')).toBeVisible();
    expect(history.location.pathname).toEqual('/content-manager/collectionType/category');
    expect(container.firstChild).toMatchInlineSnapshot(`
      .c2 {
        margin-bottom: 0;
        padding-left: 0;
        max-height: 182px;
        overflow-y: auto;
      }

      .c2::-webkit-scrollbar {
        background: transparent;
      }

      .c2::-webkit-scrollbar-track {
        background: transparent;
      }

      .c2::-webkit-scrollbar-track:hover {
        background: transparent;
      }

      .c2 li {
        position: relative;
        margin-bottom: 2px;
      }

      .c2 a {
        display: block;
        padding-left: 30px;
        height: 34px;
        border-radius: 2px;
      }

      .c2 a p {
        color: #2D3138;
        font-size: 13px;
        line-height: 34px;
        display: -webkit-box;
        display: -webkit-flex;
        display: -ms-flexbox;
        display: flex;
        -webkit-box-pack: justify;
        -webkit-justify-content: space-between;
        -ms-flex-pack: justify;
        justify-content: space-between;
        margin-bottom: 0;
      }

      .c2 a.active {
        background-color: #e9eaeb;
      }

      .c2 a.active p {
        font-weight: 600;
      }

      .c2 a.active svg {
        color: #2D3138;
      }

      .c2 a:hover {
        -webkit-text-decoration: none;
        text-decoration: none;
      }

      .c1 {
        margin-bottom: 24px;
      }

      .c1 button {
        outline: 0;
      }

      .c1 .count-info {
        position: relative;
        display: inline-block;
        height: 14px;
        min-width: 14px;
        margin-top: 2px;
        padding: 1px 3px;
        text-align: center;
        border-radius: 2px;
      }

      .c1 .count-info:before {
        content: attr(datadescr);
        position: absolute;
        top: 1px;
        height: 14px;
        min-width: 14px;
        padding: 0px 3px;
        background-color: #E9EAEB;
        border-radius: 2px;
      }

      .c1 .list-header {
        color: #919bae;
      }

      .c1 .list-header > div {
        position: relative;
      }

      .c1 .list-header h3 {
        margin-bottom: 10px;
        padding-right: 20px;
        padding-top: 2px;
        font-family: Lato;
        font-size: 1.1rem;
        line-height: normal;
        -webkit-letter-spacing: 0.1rem;
        -moz-letter-spacing: 0.1rem;
        -ms-letter-spacing: 0.1rem;
        letter-spacing: 0.1rem;
        font-weight: bold;
        text-transform: uppercase;
      }

      .c1 .list-header h3 + button {
        position: absolute;
        top: 2px;
        right: 0;
        padding: 2px 0 0px 5px;
        line-height: 11px;
      }

      .c1 .list-header h3 + button i,
      .c1 .list-header h3 + button svg {
        font-size: 11px;
      }

      .c1 .list-header .search-wrapper {
        margin-bottom: 7px;
      }

      .c1 .list-header .search-wrapper::after {
        display: block;
        content: '';
        height: 2px;
        width: calc(100% - 20px);
        background: #E9EAEB;
      }

      .c1 .list-header .search-wrapper > svg {
        position: absolute;
        bottom: 6px;
        left: 0;
        font-size: 11px;
      }

      .c1 .list-header .search-wrapper button {
        position: absolute;
        top: 0;
        right: 0;
        padding: 5px 0 0px 5px;
        line-height: 11px;
      }

      .c1 .list-header .search-wrapper button i,
      .c1 .list-header .search-wrapper button svg {
        font-size: 11px;
      }

      .c1 ul {
        list-style: none;
        padding-top: 2px;
      }

      .c1 ul li a {
        text-transform: capitalize;
      }

      .c3 {
        display: -webkit-box;
        display: -webkit-flex;
        display: -ms-flexbox;
        display: flex;
        -webkit-flex-direction: column;
        -ms-flex-direction: column;
        flex-direction: column;
        -webkit-box-pack: space-around;
        -webkit-justify-content: space-around;
        -ms-flex-pack: space-around;
        justify-content: space-around;
        width: 100%;
        height: 100vh;
      }

      .c3 > div {
        margin: auto;
        width: 50px;
        height: 50px;
        border: 6px solid #f3f3f3;
        border-top: 6px solid #1c91e7;
        border-radius: 50%;
        -webkit-animation: fEWCgj 2s linear infinite;
        animation: fEWCgj 2s linear infinite;
      }

      .c0 {
        width: 100%;
        min-height: calc(100vh - 6rem);
        background-color: #f2f3f4;
        padding-top: 3.1rem;
        padding-left: 2rem;
        padding-right: 2rem;
      }

      <div
        class="container-fluid"
      >
        <div
          class="row"
        >
          <div
            class="c0 col-md-3"
          >
            <div
              class="c1"
            >
              <div
                class="list-header"
              >
                <div
                  class="title-wrapper"
                >
                  <h3>
                    label
                      
                    <span
                      class="count-info"
                      datadescr="1"
                    >
                      1
                    </span>
                  </h3>
                  <button />
                </div>
              </div>
              <div>
                <ul
                  class="c2"
                >
                  <li>
                    <a
                      aria-current="page"
                      class="active"
                      href="/content-manager/collectionType/category"
                    >
                      <p>
                        Categories
                      </p>
                    </a>
                  </li>
                </ul>
              </div>
            </div>
            <div
              class="c1"
            >
              <div
                class="list-header"
              >
                <div
                  class="title-wrapper"
                >
                  <h3>
                    label
                      
                    <span
                      class="count-info"
                      datadescr="1"
                    >
                      1
                    </span>
                  </h3>
                  <button />
                </div>
              </div>
              <div>
                <ul
                  class="c2"
                >
                  <li>
                    <a
                      href="/homepage"
                    >
                      <p>
                        Home page
                      </p>
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div
            class="col-md-9"
            style="padding: 0px;"
          >
            <div
              class="c3"
            >
              <div />
            </div>
          </div>
        </div>
      </div>
    `);
  });

  it('should redirect to the single type', () => {
    const contentManagerState = {
      collectionTypeLinks: [],
      singleTypeLinks: [
        {
          uid: 'homepage',
          title: 'Home page',
          name: 'homepage',
          to: '/content-manager/homepage',
          kind: 'singleType',
          isDisplayed: true,
          permissions: [
            {
              action: 'plugins::content-manager.explorer.read',
              subject: 'homepage',
            },
          ],
        },
      ],
      models: [
        {
          kind: 'collectionType',
          uid: 'category',
          info: { label: 'Categories', name: 'category' },
        },
        { kind: 'singleType', uid: 'homepage', info: { label: 'Home page', name: 'homepage' } },
      ],
      components: [],
      status: 'resolved',
    };
    useModels.mockImplementation(() => contentManagerState);
    const rootReducer = combineReducers(cmReducers);
    const store = createStore(rootReducer, { 'content-manager_app': contentManagerState });
    const history = createMemoryHistory();
    history.push('/content-manager');

    render(
      <Provider store={store}>
        <Router history={history}>
          <ContentManagerApp />
        </Router>
      </Provider>
    );

    expect(history.location.pathname).toEqual('/content-manager/homepage');
  });

  it('should redirect to 403 page', () => {
    const history = createMemoryHistory();
    const contentManagerState = {
      collectionTypeLinks: [],
      singleTypeLinks: [],
      models: [
        {
          kind: 'collectionType',
          uid: 'category',
          info: { label: 'Categories', name: 'category' },
        },
        { kind: 'singleType', uid: 'homepage', info: { label: 'Home page', name: 'homepage' } },
      ],
      components: [],
      status: 'resolved',
    };
    useModels.mockImplementation(() => contentManagerState);
    jest.mock('../useModels', () =>
      jest.fn(() => {
        return contentManagerState;
      })
    );
    const rootReducer = combineReducers(cmReducers);
    const store = createStore(rootReducer, { 'content-manager_app': contentManagerState });
    history.push('/content-manager/collectionType/category');

    render(
      <DndProvider backend={HTML5Backend}>
        <Provider store={store}>
          <Router history={history}>
            <ContentManagerApp />
          </Router>
        </Provider>
      </DndProvider>
    );

    expect(history.location.pathname).toEqual('/content-manager/403');
  });

  it('should redirect to the no-content-types page', () => {
    const history = createMemoryHistory();
    const contentManagerState = {
      collectionTypeLinks: [],
      singleTypeLinks: [],
      models: [],
      components: [],
      status: 'resolved',
    };
    useModels.mockImplementation(() => contentManagerState);
    jest.mock('../useModels', () =>
      jest.fn(() => {
        return contentManagerState;
      })
    );
    const rootReducer = combineReducers(cmReducers);
    const store = createStore(rootReducer, { 'content-manager_app': contentManagerState });
    history.push('/content-manager/collectionType/category');

    render(
      <DndProvider backend={HTML5Backend}>
        <Provider store={store}>
          <Router history={history}>
            <ContentManagerApp />
          </Router>
        </Provider>
      </DndProvider>
    );

    expect(history.location.pathname).toEqual('/content-manager/no-content-types');
  });
});
