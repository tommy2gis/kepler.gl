// Copyright (c) 2021 Uber Technologies, Inc.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

import React, {Component} from 'react';
import AutoSizer from 'react-virtualized/dist/commonjs/AutoSizer';
import styled, {ThemeProvider} from 'styled-components';
import window from 'global/window';
import {connect} from 'react-redux';
import {theme} from '@tommy2gis/swsk.kepler.gl/styles';
import Banner from './components/banner';
import Announcement, {FormLink} from './components/announcement';
import {replaceLoadDataModal} from './factories/load-data-modal';
import {replaceMapControl} from './factories/map-control';
import {replacePanelHeader} from './factories/panel-header';
import {AUTH_TOKENS} from './constants/default-settings';
import {
  loadRemoteMap,
  loadSampleConfigurations,
  onExportFileSuccess,
  onLoadCloudMapSuccess,
  onLoadCloudMapError
} from './actions';

import {loadCloudMap, updateMap} from '@tommy2gis/swsk.kepler.gl/actions';
import {CLOUD_PROVIDERS} from './cloud-providers';

const KeplerGl = require('@tommy2gis/swsk.kepler.gl/components').injectComponents([
  replaceLoadDataModal(),
  replaceMapControl(),
  replacePanelHeader()
]);

const BannerHeight = 30;
const BannerKey = 'kgHideBanner-iiba';
const keplerGlGetState = state => state.demo.keplerGl;

const GlobalStyle = styled.div`
  font-family: ff-clan-web-pro, 'Helvetica Neue', Helvetica, sans-serif;
  font-weight: 400;
  font-size: 0.875em;
  line-height: 1.71429;

  *,
  *:before,
  *:after {
    -webkit-box-sizing: border-box;
    -moz-box-sizing: border-box;
    box-sizing: border-box;
  }

  ul {
    margin: 0;
    padding: 0;
  }

  li {
    margin: 0;
  }

  a {
    text-decoration: none;
    color: ${props => props.theme.labelColor};
  }
`;

class App extends Component {
  state = {
    showBanner: false,
    width: window.innerWidth,
    height: window.innerHeight
  };

  componentDidMount() {
    // if we pass an id as part of the url
    // we ry to fetch along map configurations
    const {params: {id, provider} = {}, location: {query = {}} = {}} = this.props;

    const cloudProvider = CLOUD_PROVIDERS.find(c => c.name === provider);
    if (cloudProvider) {
      this.props.dispatch(
        loadCloudMap({
          loadParams: query,
          provider: cloudProvider,
          onSuccess: onLoadCloudMapSuccess
        })
      );
      return;
    }

    // Load sample using its id
    if (id) {
      this.props.dispatch(loadSampleConfigurations(id));
    }

    // Load map using a custom
    if (query.mapUrl) {
      // TODO?: validate map url
      this.props.dispatch(loadRemoteMap({dataUrl: query.mapUrl}));
    }
    this.props.dispatch(updateMap({latitude: 31.5396, longitude: 120.33202658}));

    // delay zs to show the banner
    if (!window.localStorage.getItem(BannerKey)) {
      window.setTimeout(this._showBanner, 3000);
    }
    // load sample data
    // this._loadSampleData();

    // Notifications
    // this._loadMockNotifications();
  }

  _showBanner = () => {
    this.setState({showBanner: true});
  };

  _hideBanner = () => {
    this.setState({showBanner: false});
  };

  _disableBanner = () => {
    this._hideBanner();
    window.localStorage.setItem(BannerKey, 'true');
  };

  _getMapboxRef = (mapbox, index) => {
    if (!mapbox) {
      // The ref has been unset.
      // https://reactjs.org/docs/refs-and-the-dom.html#callback-refs
      // console.log(`Map ${index} has closed`);
    } else {
      // We expect an InteractiveMap created by KeplerGl's MapContainer.
      // https://uber.github.io/react-map-gl/#/Documentation/api-reference/interactive-map
      const map = mapbox.getMap();
      map.on('zoomend', e => {
        // console.log(`Map ${index} zoom level: ${e.target.style.z}`);
      });
    }
  };

  render() {
    const mapStyles = [
      {
        id: 'dark',
        label: '天地图道路',
        url: 'http://localhost:8081/mapboxstyle/roadstyle.json',
        icon: `http://61.177.139.232:8081/mapclient/mapboxstyle/road.png`,
        layerGroups: []
      },
      {
        id: 'bright',
        label: '天地图影像',
        url: 'http://localhost:8081/mapboxstyle/imgstyle.json',
        icon: `http://61.177.139.232:8088/mapclient/mapboxstyle/img.png`,
        layerGroups: []
      }
    ];

    const {showBanner} = this.state;
    return (
      <ThemeProvider theme={theme}>
        <GlobalStyle
          // this is to apply the same modal style as kepler.gl core
          // because styled-components doesn't always return a node
          // https://github.com/styled-components/styled-components/issues/617
          ref={node => {
            node ? (this.root = node) : null;
          }}
        >
          <Banner
            show={this.state.showBanner}
            height={BannerHeight}
            bgColor="#2E7CF6"
            onClose={this._hideBanner}
          >
            <Announcement onDisable={this._disableBanner} />
          </Banner>
          <div
            style={{
              transition: 'margin 1s, height 1s',
              position: 'absolute',
              width: '100%',
              height: '100%',
              left: 0,
              top: 0
            }}
          >
            <AutoSizer>
              {({height, width}) => (
                <KeplerGl
                  mapboxApiAccessToken={AUTH_TOKENS.MAPBOX_TOKEN}
                  id="map"
                  /*
                   * Specify path to keplerGl state, because it is not mount at the root
                   */
                  getState={keplerGlGetState}
                  width={width}
                  height={height}
                  mapStylesReplaceDefault={true}
                  mapStyles={mapStyles}
                />
              )}
            </AutoSizer>
          </div>
        </GlobalStyle>
      </ThemeProvider>
    );
  }
}

const mapStateToProps = state => state;
const dispatchToProps = dispatch => ({dispatch});

export default connect(mapStateToProps, dispatchToProps)(App);
