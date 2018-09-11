// @flow

import React, { Component } from 'react';
import type { InputEvent, I18n } from '../types';
import typeof { setMovesBase, setRoutePaths, setClicked, setAnimatePause, setAnimateReverse, setLoading } from '../actions';

type Props = {
  actions: {
    setMovesBase: setMovesBase,
    setRoutePaths: setRoutePaths,
    setClicked: setClicked,
    setAnimatePause: setAnimatePause,
    setAnimateReverse: setAnimateReverse,
    setLoading: setLoading,
  },
  i18n: I18n,
  id: string,
  className: string,
  style: Object
}

export default class MovesInput extends Component<Props> {
  static defaultProps = {
    i18n: {
      formatError: 'ラインマップデータ形式不正'
    }
  }

  onSelect(e: InputEvent) {
    const { i18n, actions } = this.props;
    const reader = new FileReader();
    const file = e.target.files[0];
    if (!file) {
      return;
    }
    actions.setLoading(true);
    actions.setMovesBase([]);
    reader.readAsText(file);
    reader.onload = () => {
      let readdata = '';
      try {
        readdata = JSON.parse(reader.result.toString());
      } catch (exception) {
        actions.setLoading(false);
        window.alert(exception);
        return;
      }
      if (!Array.isArray(readdata)) { // Not Array?
        const { movesbase } = readdata;
        if (!movesbase) {
          actions.setLoading(false);
          window.alert(i18n.formatError);
          return;
        }
      }
      actions.setMovesBase(readdata);
      actions.setRoutePaths([]);
      actions.setClicked(null);
      actions.setAnimatePause(false);
      actions.setAnimateReverse(false);
      actions.setLoading(false);
    };
  }

  render() {
    const { id, className, style } = this.props;

    return (
      <input type="file" accept=".json" onChange={this.onSelect.bind(this)} id={id} className={className} style={style} />
    );
  }
}
