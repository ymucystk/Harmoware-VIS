import * as React from 'react';
import { ActionTypes } from '../types';

interface Props {
  actions: ActionTypes,
  id?: string,
  className?: string,
  style?: React.CSSProperties
}

const LinemapInput = (props:Props)=>{
  const { actions, id, className, style } = props;

  const onClick = React.useCallback((e: React.ChangeEvent<any>)=>{
    actions.setInputFilename({ linemapFileName: null });
    actions.setLinemapData([]);
    e.target.value = '';
  },[])

  const onSelect = React.useCallback((e: React.ChangeEvent<HTMLInputElement>)=>{
    const reader = new FileReader();
    const file = e.target.files[0];
    if (!file) {
      return;
    }
    actions.setLoading(true);
    actions.setLinemapData([]);
    reader.readAsText(file);
    const file_name: string = file.name;
    reader.onload = () => {
      let readdata = [];
      try {
        readdata = JSON.parse(reader.result.toString());
      } catch (exception) {
        actions.setLoading(false);
        window.alert(exception);
        return;
      }
      if (readdata.length > 0) {
        actions.setInputFilename({ linemapFileName: file_name });
        actions.setLoading(false);
        actions.setLinemapData(readdata);
        return;
      }
      actions.setInputFilename({ linemapFileName: null });
      actions.setLinemapData([]);
      actions.setLoading(false);
    };
  },[])

  const Result = React.useMemo(()=>
    <input type="file" accept=".json"
    id={id} className={className} style={style}
    onClick={onClick}
    onChange={onSelect}
    />
  ,[props])

  return Result
}
export default LinemapInput
