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

import React, {Component, createRef} from 'react';
import classnames from 'classnames';
import PropTypes from 'prop-types';
import {createSelector} from 'reselect';
import styled, {withTheme, css} from 'styled-components';
import {sortableContainer, sortableElement, sortableHandle} from 'react-sortable-hoc';
import Modal from 'react-modal';

import {Button, InlineInput} from 'components/common/styled-components';
import {VertDots, Trash} from 'components/common/icons';
import ColorPalette from './color-palette';
import CustomPicker from './custom-picker';
import {arrayMove} from 'utils/data-utils';

const dragHandleActive = css`
  .layer__drag-handle {
    color: ${props => props.theme.textColorHl};
    opacity: 1;
    cursor: move;
  }
`;

const StyledSortableItem = styled.div`
  display: flex;
  align-items: center;
  padding-top: 6px;
  padding-bottom: 6px;
  z-index: ${props => props.theme.dropdownWrapperZ + 1};

  :not(.sorting) {
    :hover {
      background-color: ${props => props.theme.panelBackgroundHover};
      ${dragHandleActive}
    }
  }

  &.sorting-colors {
    background-color: ${props => props.theme.panelBackgroundHover};
    ${dragHandleActive}
  }
`;

const StyledDragHandle = styled.div`
  display: flex;
  align-items: center;
  opacity: 0;
`;

const StyledTrash = styled.div`
  color: ${props => props.theme.textColor};
  svg {
    :hover {
      color: ${props => props.theme.subtextColorActive};
    }
  }
  height: 12px;
  margin-left: auto;
  margin-right: 12px;
  :hover {
    cursor: pointer;
  }
`;

const StyledLine = styled.div`
  width: calc(100% - 16px);
  height: 1px;
  background-color: ${props => props.theme.labelColor};
  margin-top: 8px;
  margin-left: 8px;
`;

const StyledSwatch = styled.div.attrs({
  className: 'custom-palette__swatch'
})`
  background-color: ${props => props.color};
  width: 32px;
  height: 18px;
  display: inline-block;
  :hover {
    box-shadow: ${props => props.theme.boxShadow};
    cursor: pointer;
  }
`;

const StyledColorRange = styled.div`
  padding: 0 8px;
  :hover {
    background-color: ${props => props.theme.panelBackgroundHover};
    cursor: pointer;
  }
`;

const StyledButtonContainer = styled.div`
  margin-top: 11px;
  display: flex;
  direction: rtl;
`;

const StyledInlineInput = styled.div`
  margin-left: 12px;
  input {
    color: ${props => props.theme.textColorHl};
    font-size: 10px;
  }
`;

const SortableItem = sortableElement(({children, isSorting}) => (
  <StyledSortableItem
    className={classnames('custom-palette__sortable-items', {sorting: isSorting})}
  >
    {children}
  </StyledSortableItem>
));

const SortableContainer = sortableContainer(({children}) => <div>{children}</div>);

const DragHandle = sortableHandle(({className, children}) => (
  <StyledDragHandle className={className}>{children}</StyledDragHandle>
));

class CustomPalette extends Component {
  static propTypes = {
    customPalette: PropTypes.shape({
      name: PropTypes.string,
      type: PropTypes.string,
      category: PropTypes.string,
      colors: PropTypes.arrayOf(PropTypes.string)
    }),
    setCustomPalette: PropTypes.func,
    showSketcher: PropTypes.oneOfType([PropTypes.bool, PropTypes.number]),
    theme: PropTypes.object,
    defaultSketcherPos: PropTypes.object,
    sketcherHeight: PropTypes.number,
    bottomBuffer: PropTypes.number
  };

  static defaultProps = {
    defaultSketcherPos: {top: '320px', left: '320px'},
    sketcherHeight: 228,
    bottomBuffer: 212
  };

  state = {
    // currentSwatchIndex: null,
    isSorting: false
  };

  root = createRef();

  // derive sketcher position based on root component
  showSketcherSelector = props => props.showSketcher;
  themeSelector = props => props.theme;
  sketcherPosSelector = createSelector(this.showSketcherSelector, (showSketcher, theme = {}) => {
    const {defaultSketcherPos, bottomBuffer, sketcherHeight} = this.props;
    if (showSketcher === false || !this.root || !this.root.current) return defaultSketcherPos;
    const {sidePanelInnerPadding = 16, sidePanel = {}, sidePanelScrollBarWidth = 10} = theme;
    const sidePanelLeft = (sidePanel.margin || {}).left || 20;
    const offsetX = sidePanelInnerPadding + sidePanelLeft + sidePanelScrollBarWidth;
    // find component Root position
    const bounding = this.root.current.getBoundingClientRect();
    const {x, y, width} = bounding;

    // set the top so it won't collide with bottom widget
    const top =
      y + sketcherHeight <= window.innerHeight - bottomBuffer
        ? y
        : window.innerHeight - bottomBuffer - sketcherHeight;

    return {top: `${top}px`, left: `${x + width + offsetX}px`};
  });

  modalStylesSelector = createSelector(
    this.themeSelector,
    this.sketcherPosSelector,
    (theme, sketcherPos) => ({
      content: {
        top: 0,
        left: 0,
        border: 0,
        right: 'auto',
        bottom: 'auto',
        padding: '0px 0px 0px 0px',
        borderRadius: theme.panelBorderRadius || '2px'
      },
      overlay: {
        ...sketcherPos,
        right: 'auto',
        bottom: 'auto',
        backgroundColor: 'rgba(0, 0, 0, 0)'
      }
    })
  );
  _setColorPaletteUI(colors) {
    this.props.setCustomPalette({
      colors
    });
  }

  _onPickerUpdate = color => {
    const {colors} = this.props.customPalette;
    const newColors = [...colors];
    newColors[this.props.showSketcher] = color.hex;
    this._setColorPaletteUI(newColors);
  };

  _onColorDelete = index => {
    const {colors} = this.props.customPalette;
    const newColors = [...colors];
    if (newColors.length > 1) {
      newColors.splice(index, 1);
    }
    this._setColorPaletteUI(newColors);
  };

  _onColorAdd = () => {
    const {colors} = this.props.customPalette;
    // add the last color
    const newColors = [...colors, colors[colors.length - 1]];
    this._setColorPaletteUI(newColors);
  };

  _onSwatchClick = index => {
    this.props.onToggleSketcher(index);
  };

  _onSwatchClose = () => {
    this.props.onToggleSketcher(false);
  };

  _onApply = event => {
    event.stopPropagation();
    event.preventDefault();
    this.props.onCancel();
    this.props.onApply(this.props.customPalette, event);
  };

  _onSortEnd = ({oldIndex, newIndex}) => {
    const {colors} = this.props.customPalette;
    const newColors = arrayMove(colors, oldIndex, newIndex);
    this._setColorPaletteUI(newColors);
    this.setState({isSorting: false});
  };

  _onSortStart = () => {
    this.setState({isSorting: true});
  };

  _inputColorHex = (index, {target: {value}}) => {
    const {colors} = this.props.customPalette;
    const newColors = [...colors];
    newColors[index] = value.toUpperCase();
    this._setColorPaletteUI(newColors);
  };

  render() {
    const {colors} = this.props.customPalette;
    const modalStyles = this.modalStylesSelector(this.props);

    return (
      <div className="custom-palette-panel" ref={this.root}>
        <StyledColorRange>
          <ColorPalette colors={colors} />
        </StyledColorRange>
        <SortableContainer
          className="custom-palette-container"
          onSortEnd={this._onSortEnd}
          onSortStart={this._onSortStart}
          lockAxis="y"
          helperClass="sorting-colors"
          useDragHandle
        >
          {colors.map((color, index) => (
            <SortableItem key={index} index={index} isSorting={this.state.isSorting}>
              <DragHandle className="layer__drag-handle">
                <VertDots height="20px" />
              </DragHandle>
              <StyledSwatch color={color} onClick={e => this._onSwatchClick(index, e)} />
              <StyledInlineInput>
                <InlineInput
                  type="text"
                  className="custom-palette-hex__input"
                  value={color.toUpperCase()}
                  onClick={e => {
                    e.stopPropagation();
                  }}
                  onChange={e => this._inputColorHex(index, e)}
                  id="input-layer-label"
                />
              </StyledInlineInput>
              <StyledTrash onClick={() => this._onColorDelete(index)}>
                <Trash className="trashbin" />
              </StyledTrash>
            </SortableItem>
          ))}
        </SortableContainer>
        {/* Add Step Button */}
        <Button className="add-step__button" link onClick={this._onColorAdd}>
          + 添加颜色
        </Button>
        <StyledLine />
        {/* Cancel or Confirm Buttons */}
        <StyledButtonContainer>
          <Button className="confirm-apply__button" link onClick={this._onApply}>
            确定
          </Button>
          <Button link onClick={this.props.onCancel}>
            {' '}
            取消
          </Button>
        </StyledButtonContainer>
        {this.props.showSketcher !== false ? (
          <Modal
            isOpen
            style={modalStyles}
            ariaHideApp={false}
            parentSelector={() => {
              // React modal issue: https://github.com/reactjs/react-modal/issues/769
              // failed to execute removeChild on parent node when it is already unmounted
              return (
                this.root.current || {
                  removeChild: () => {},
                  appendChild: () => {}
                }
              );
            }}
          >
            <CustomPicker
              color={colors[this.props.showSketcher]}
              onChange={this._onPickerUpdate}
              onSwatchClose={this._onSwatchClose}
            />
          </Modal>
        ) : null}
      </div>
    );
  }
}

export default withTheme(CustomPalette);
