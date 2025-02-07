import * as React from 'react';
import { Icon } from 'react-icons-kit';
import { ic_replay as icReplay } from 'react-icons-kit/md';
import { ActionTypes } from '../types';

interface Props {
  actions: ActionTypes,
  children?: React.ReactNode,
  i18n?: { reverseButtonCaption: string },
  className?: string,
  title?: string,
}

const default_style = { 'display': 'flex', 'justifyContent': 'center' };

const ReverseButton = (props:Props)=>{
  const { children, i18n, className, title: propTitle } = props;

  const setAnimateReverse = ()=>{
    props.actions.setAnimateReverse(true);
  }

  const Result = React.useMemo(()=>
    <button onClick={setAnimateReverse} className={className}
      title={propTitle || (children && children.toString()) || i18n.reverseButtonCaption}>
      {children === undefined ?
        <span style={default_style}>
        <Icon icon={icReplay} />&nbsp;{i18n.reverseButtonCaption}</span> :
        <span>{children}</span>
      }</button>,[props])

  return Result
}
ReverseButton.defaultProps = {
  i18n: {
    reverseButtonCaption: 'REVERSE'
  },
  className: 'harmovis_button'
}
export default ReverseButton
