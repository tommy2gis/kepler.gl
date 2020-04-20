// Copyright (c) 2020 Uber Technologies, Inc.
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

import React, {useEffect, useState} from 'react';
import window from 'global/window';
import {connect} from 'react-redux';
import {replaceMapControl} from './factories/map-control';
import {replacePanelHeader} from './factories/panel-header';
import { addDataToMap, wrapTo} from "@shitao1988/swsk-kepler-gl/actions";
import { processRowObject, processGeojson } from "@shitao1988/swsk-kepler-gl/processors";

const KeplerGl = require('@shitao1988/swsk-kepler-gl/components').injectComponents([
  replaceMapControl(),
  replacePanelHeader()
]);

const theme = {
  sidePanelBg: '#ffffff',
  titleTextColor: '#000000',
  sidePanelHeaderBg: '#f7f7F7',
  subtextColorActive: '#2473bd',
  tooltipBg: '#1869b5',
  tooltipColor: '#ffffff',
  dropdownListBgd: '#ffffff',
  textColorHl: '#2473bd',
  inputBgd: '#f7f7f7',
  primaryBtnColor: '#1869b5',
  inputBgdHover: '#ffffff',
  inputBgdActive: '#ffffff',
  dropdownListHighlightBg: '#f0f0f0',
  panelBackground: '#f7f7F7',
  panelBackgroundHover: '#f7f7F7',
  secondaryInputBgd: '#f7f7F7',
  secondaryInputBgdActive: '#f7f7F7',
  secondaryInputBgdHover: '#ffffff',
  panelActiveBg: '#f7f7F7'
};

const emptyTheme = {};

function App(props) {
  const [customTheme, setTheme] = useState(false);
  const [windowDimension, setDimension] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  const mapStyles = [
    {
      id: 'dark',
      label: '天地图道路',
      url: 'http://localhost:8081/datavisual/roadstyle.json',
      icon: `http://localhost:8081/datavisual/road.png`,
      layerGroups: []
    },
    {
      id: 'tdtimg',
      label: '天地图影像',
      url: 'http://localhost:8081/datavisual/imgstyle.json',
      icon: `http://localhost:8081/datavisual/img.png`,
      layerGroups: []
    },
  ];

  useEffect(() => {
    const handleResize = () => {
      setDimension({width: window.innerWidth, height: window.innerHeight});
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const receiveMessage = event => {
      console.log(event.data);
      if (event !== undefined && event.data&&event.data.title) {
        props.dispatch(
          wrapTo(
            "map",
            addDataToMap({
              datasets: [
                {
                  info: { label: event.data.title, id: event.data.id },
                  data: processGeojson(event.data)
                }
              ]
            })
          )
        );
      }
    };
    window.addEventListener('message', receiveMessage, false);
    return () => window.removeEventListener('message', receiveMessage);
  }, []);

  return (
    <div>
      <KeplerGl
        mapboxApiAccessToken="pk.eyJ1Ijoic2hpdGFvMTk4OCIsImEiOiJjaWc3eDJ2eHowMjA5dGpsdzZlcG5uNWQ5In0.nQQjb4DrqnZtY68rOQIjJA"
        id="map"
        /*
         * Specify path to keplerGl state, because it is not mount at the root
         */
        getState={state => state.demo.keplerGl}
        mapStylesReplaceDefault={true}
        mapStyles={mapStyles}
        width={windowDimension.width}
        height={windowDimension.height}
        theme={props.demo.app.theme === 'light' ? theme : emptyTheme}
      />
    </div>
  );
  // }
}

const mapStateToProps = state => state;
const dispatchToProps = dispatch => ({dispatch});

export default connect(mapStateToProps, dispatchToProps)(App);
