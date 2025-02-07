import * as React from 'react';
import { PolygonLayer, PointCloudLayer } from '@deck.gl/layers';
import { Marker, Popup } from 'react-map-gl';
import { Container, MovesLayer, DepotsLayer, LineMapLayer, HarmoVisLayers, MovedData,
  connectToHarmowareVis, LoadingIcon, BasedProps, EventInfo, FpsDisplay, Viewport } from 'harmoware-vis';
import Controller from '../components/controller';
import SvgIcon from '../icondata/SvgIcon';

// MovesLayer で iconCubeType=1(ScenegraphLayer) を使用する場合に登録要
const scenegraph = '../sampledata/car.glb';
const defaultInterval = 1000;
const mapStyle:string[] = [
  'mapbox://styles/mapbox/dark-v8', //0
  'mapbox://styles/mapbox/light-v8', //1
  'mapbox://styles/mapbox/streets-v8', //2
  'mapbox://styles/mapbox/satellite-v8', //3
  'mapbox://styles/mapbox/outdoors-v10', //4
];

const MAPBOX_TOKEN: string = process.env.MAPBOX_ACCESS_TOKEN;

export interface State {
  mapboxVisible: boolean,
  mapStyleNo: number,
  moveDataVisible: boolean,
  moveOptionVisible: boolean,
  moveOptionArcVisible: boolean,
  moveOptionLineVisible: boolean,
  moveSvgVisible: boolean,
  depotOptionVisible: boolean,
  heatmapVisible: boolean,
  optionChange: boolean,
  iconChange: boolean,
  iconCubeType: number,
  popup: any[],
  popupInfo: MovedData,
  terrain: boolean,
  heatmapArea: number
}
const initState:State = {
  mapboxVisible: true,
  mapStyleNo: 0,
  moveDataVisible: true,
  moveOptionVisible: false,
  moveOptionArcVisible: false,
  moveOptionLineVisible: false,
  moveSvgVisible: false,
  depotOptionVisible: false,
  heatmapVisible: false,
  optionChange: false,
  iconChange: true,
  iconCubeType: 0,
  popup: [0, 0, ''],
  popupInfo: null,
  terrain: false,
  heatmapArea: 1
}

const heatmapColor = [
  [255,237,209,255],[248,203,98,255],[246,163,52,255],[232,93,38,255],[207,62,55,255]
]

class IconFollow extends Container<BasedProps>{
  constructor(props:BasedProps){
    super(props)
    this.follwTimerId = null
    this.followingiconId = -1
    this.iconFollwNext = this.iconFollwNext.bind(this)
    this.getFollowingiconIdSelected = this.getFollowingiconIdSelected.bind(this)
    this.onTransitionInterrupt = this.onTransitionInterrupt.bind(this)
  }
  follwTimerId: NodeJS.Timeout
  followingiconId: number

  iconFollwNext(movesbaseidx:number){
    const {animateReverse,animatePause,loopEndPause,movesbase,settime,secperhour,actions} = this.props;
    const base = movesbase[movesbaseidx];
    if(base && base.operation && base.departuretime <= settime && settime < base.arrivaltime){
      if (!animatePause && !loopEndPause) {
        let next = undefined;
        let direction = 0;
        const nextIdx = base.operation.findIndex(x=>x.elapsedtime > settime);
        if (!animateReverse) {
          next = base.operation[nextIdx];
          if(nextIdx === base.operation.length - 1){
            direction = base.operation[nextIdx-1].direction;
          }else{
            direction = base.operation[nextIdx].direction;
          }
        }else{
          next = base.operation[nextIdx-1];
          direction = base.operation[nextIdx-1].direction;
        }
        if(next && next.position){
          const transitionDuration = (Math.abs(next.elapsedtime - settime)/3.6) * secperhour;
          actions.setViewport({
            longitude:next.position[0], latitude:next.position[1], bearing:direction,
            transitionDuration,
          });
          this.follwTimerId = setTimeout(this.iconFollwNext,transitionDuration,movesbaseidx);
          this.followingiconId = movesbaseidx
          return
        }
      }
    }
    this.follwTimerId = null      
  }

  getFollowingiconIdSelected(e: React.ChangeEvent<HTMLSelectElement>){
    clearTimeout(this.follwTimerId);
    this.follwTimerId = null
    const movesbaseidx:number = +e.target.value;
    if(movesbaseidx < 0) return;
    const data = this.props.movedData.find(x=>x.movesbaseidx === movesbaseidx);
    if(data && data.position){
      this.props.actions.setViewport({
        longitude:data.position[0], latitude:data.position[1], bearing:data.direction
      });
      setTimeout(this.iconFollwNext,0,movesbaseidx);
      this.followingiconId = movesbaseidx
      return;
    }
    this.followingiconId = -1
  }

  onTransitionInterrupt(){
    const {follwTimerId} = this
    if(follwTimerId){
      console.log('follwTimerId')
      clearTimeout(follwTimerId);
      this.follwTimerId = null
      this.followingiconId = -1
    }
  }

  componentDidUpdate(prevProps:BasedProps) {
    if(this.follwTimerId){
      const {animateReverse,animatePause,loopEndPause,secperhour,actions,movedData} = this.props;
      if(animateReverse !== prevProps.animateReverse || animatePause !== prevProps.animatePause ||
        loopEndPause !== prevProps.loopEndPause || secperhour !== prevProps.secperhour){
        clearTimeout(this.follwTimerId);
        this.follwTimerId = null
        if(this.followingiconId >= 0){
          const findData = movedData.find(x=>x.movesbaseidx===this.followingiconId)
          if(findData !== undefined){
            actions.setViewport({
              longitude:findData.position[0], latitude:findData.position[1]
            });
            if(!animatePause && !loopEndPause){
              setTimeout(this.iconFollwNext,0,this.followingiconId);
              return
            }
          }
        }
        this.followingiconId = -1
      }
    }else{
      if(this.followingiconId >= 0){
        const findData = this.props.movedData.find(x=>x.movesbaseidx===this.followingiconId)
        if(findData !== undefined){
          setTimeout(this.iconFollwNext,0,this.followingiconId);
        }
      }
    }
  }

  render(){
    return (<>{this.props.children}</>)
  }
}

const App = (props:BasedProps)=>{
  const { actions, routePaths, viewport, loading,
    clickedObject, movedData, movesbase, depotsData, linemapData } = props;

  const [state,setState] = React.useState<State>(initState)
  const iconFollowRef = React.useRef(undefined)

  const viewportPlayback = (viewportArray: Viewport[])=>{
    if(viewportArray && viewportArray.length > 0){
      const viewportArrayBase = [...viewportArray]
      const viewport = viewportArrayBase.shift();
      actions.setViewport(viewport);
      const {transitionDuration = defaultInterval} = viewport;
      const timeoutValue = (transitionDuration === 'auto' ?
        defaultInterval : transitionDuration);
        App.playbackTimerId = setTimeout(viewportPlayback,timeoutValue,viewportArrayBase);
    }else{
      App.playbackTimerId = null
    }
  }

  React.useEffect(()=>{
    setTimeout(()=>{document.getElementById('deckgl-wrapper').focus()},1000)
  },[])

  document.onkeydown = (event:any)=>{
    const tagName = event.target.tagName
    console.log(`tagName:${tagName}`)
    if(tagName !== "INPUT" && tagName !== "SELECT"){
      const keyName = event.key
      console.log(`keypress:${keyName}`)
      if(keyName === "8"){
        document.getElementById('deckgl-wrapper').focus()
      }
      if(keyName === "7"){
        actions.addMinutes(-10)
      }
      if(keyName === "9"){
        actions.addMinutes(10)
      }
      if(keyName === "5"){
        actions.setAnimateReverse(!props.animateReverse)
      }
      if(keyName === "4"){
        actions.addMinutes(-5)
      }
      if(keyName === "6"){
        actions.addMinutes(5)
      }
      if(keyName === "2"){
        actions.setAnimatePause(!props.animatePause)
      }
      if(keyName === "1" && props.animatePause === true){
        actions.setTime(props.settime-1)
      }
      if(keyName === "3" && props.animatePause === true){
        actions.setTime(props.settime+1)
      }
      if(keyName === "+"){
        const value = event.shiftKey?0.25:0.5
        const zoom = Math.min(viewport.zoom + value, viewport.maxZoom);
        actions.setViewport({zoom, transitionDuration:100});
      }
      if(keyName === "-"){
        const value = event.shiftKey?0.25:0.5
        const zoom = Math.min(viewport.zoom - value, viewport.maxZoom);
        actions.setViewport({zoom, transitionDuration:100});
      }
      if(keyName === "*"){
        actions.setDefaultViewport(undefined);
      }
      if(keyName === "("){
        const value = props.multiplySpeed - (event.ctrlKey?1:10)
        const multiplySpeed = Math.min(3600, Math.max(1, value));
        actions.setMultiplySpeed(multiplySpeed);
      }
      if(keyName === ")"){
        const value = props.multiplySpeed + (event.ctrlKey?1:10)
        const multiplySpeed = Math.min(3600, Math.max(1, value));
        actions.setMultiplySpeed(multiplySpeed);
      }
    }
  }

  const getMapboxChecked = (e: React.ChangeEvent<HTMLInputElement>)=>{
    setState({ ...state, mapboxVisible: e.target.checked });
  }

  const getMapStyleSelected = (e: React.ChangeEvent<HTMLSelectElement>)=>{
    setState({ ...state, mapStyleNo: +e.target.value });
  }

  const getTerrainChecked = (e: React.ChangeEvent<HTMLInputElement>)=>{
    setState({ ...state, terrain: e.target.checked });
  }

  const getMoveDataChecked = (e: React.ChangeEvent<HTMLInputElement>)=>{
    setState({ ...state, moveDataVisible: e.target.checked });
  }

  const getMoveOptionChecked = (e: React.ChangeEvent<HTMLInputElement>)=>{
    setState({ ...state, moveOptionVisible: e.target.checked });
  }

  const getMoveOptionArcChecked = (e: React.ChangeEvent<HTMLInputElement>)=>{
    setState({ ...state, moveOptionArcVisible: e.target.checked });
  }

  const getMoveOptionLineChecked = (e: React.ChangeEvent<HTMLInputElement>)=>{
    setState({ ...state, moveOptionLineVisible: e.target.checked });
  }

  const getMoveSvgChecked = (e: React.ChangeEvent<HTMLInputElement>)=>{
    setState({ ...state, moveSvgVisible: e.target.checked });
  }

  const getDepotOptionChecked = (e: React.ChangeEvent<HTMLInputElement>)=>{
    setState({ ...state, depotOptionVisible: e.target.checked });
  }

  const getOptionChangeChecked = (e: React.ChangeEvent<HTMLInputElement>)=>{
    setState({ ...state, optionChange: e.target.checked });
  }

  const getIconChangeChecked = (e: React.ChangeEvent<HTMLInputElement>)=>{
    setState({ ...state, iconChange: e.target.checked });
  }

  const getIconCubeTypeSelected = (e: React.ChangeEvent<HTMLSelectElement>)=>{
    setState({ ...state, iconCubeType: +e.target.value });
  }

  const getFollowingiconIdSelected = (e: React.ChangeEvent<HTMLSelectElement>)=>{
    iconFollowRef.current.getFollowingiconIdSelected(e)
  }

  const getHeatmapVisible = (e: React.ChangeEvent<HTMLInputElement>)=>{
    setState({ ...state, heatmapVisible: e.target.checked });
  }

  const getHeatmapArea = (e: React.ChangeEvent<HTMLInputElement>)=>{
    setState({ ...state, heatmapArea: +e.target.value });
  }

  const getViewport = (viewport: Viewport|Viewport[])=>{
    clearTimeout(App.playbackTimerId);
    App.playbackTimerId = null
    if(Array.isArray(viewport)){
      if(viewport.length > 0){
        viewportPlayback(viewport);
      }
    }else{
      actions.setViewport(viewport);
    }
  }

  const getMarker = (data: MovedData, index: number)=>{
    const { direction, position } = data;
    if(position){
      return (<Marker key={`marker-${index}`}
      longitude={data.position[0]} latitude={data.position[1]} >
      <SvgIcon viewport={viewport} direction={direction}
      onMouseOver={() => setState({...state, popupInfo: data})}
      onMouseOut={() => setState({...state, popupInfo: null})} />
      </Marker>);
    }
    return null;
  }

  const getPopup = ()=>{
    const {popupInfo} = state;
    if(popupInfo && popupInfo.position){
      const objctlist = Object.entries(popupInfo);
      return (
        <Popup tipSize={5} anchor="bottom"
          longitude={popupInfo.position[0]} latitude={popupInfo.position[1]}
          closeButton={false} >
          <div>{objctlist.map((item)=><p>{`${item[0]}: ${item[1].toString()}`}</p>)}</div>
        </Popup>
      );
    }
    return null;
  }

  const getMapGlComponents = (movedData: MovedData[])=>{
    if(state.moveSvgVisible){
      return (<div>{movedData.map(getMarker)}{getPopup()}</div>);
    }
    return null;
  }

  const getPointCloudLayer = (PointCloudData: any[])=>{
    return PointCloudData.map((pointCloudElements:{pointCloud:any[]}, idx:number)=>{
      const {pointCloud} = pointCloudElements;
      const data = pointCloud.filter(x=>x.position);
      return new PointCloudLayer({
        id: 'PointCloudLayer-' + String(idx),
        data,
        getColor: (x: any) => x.color || [255,255,255,255],
        sizeUnits: 'meters',
        pointSize: 1,
      });
    });
  }

  const arrStrConv = (value:any)=>Array.isArray(value)?`[${value.map(el=>arrStrConv(el))}]`:value.toString()

  const onHover = (el: EventInfo)=>{
    if (el && el.object) {
      let disptext = '';
      const objctlist = Object.entries(el.object);
      for (let i = 0, lengthi = objctlist.length; i < lengthi; i=(i+1)|0) {
        const strvalue = arrStrConv(objctlist[i][1]);
        disptext = disptext + (i > 0 ? '\n' : '');
        disptext = disptext + (`${objctlist[i][0]}: ${strvalue}`);
      }
      setState({ ...state, popup: [el.x, el.y, disptext] });
    } else {
      setState({ ...state, popup: [0, 0, ''] });
    }
  }

  const onLoad = ()=>{
    actions.setViewport({
      onTransitionInterrupt: onTransitionInterrupt
    } as any);
  }

  const onTransitionInterrupt = ()=>{
    console.log('onTransitionInterrupt')
    iconFollowRef.current.onTransitionInterrupt()
    const {playbackTimerId} = App
    if(playbackTimerId){
      console.log('playbackTimerId')
      clearTimeout(playbackTimerId);
      App.playbackTimerId = null
    }
  }

  const distance_rate = [0.0110910, 0.0090123]  //初期値は北緯37度での係数（度/km）
  React.useEffect(()=>{
    const R = Math.PI / 180;
    const long1 = viewport.longitude*R
    const long2 = (viewport.longitude+1)*R
    const lati1 = viewport.latitude*R
    const lati2 = (viewport.latitude+1)*R
    distance_rate[0] = 1/(6371 * Math.acos(Math.cos(lati1) * Math.cos(lati1) * Math.cos(long2 - long1) + Math.sin(lati1) * Math.sin(lati1)))
    distance_rate[1] = 1/(6371 * Math.acos(Math.cos(lati1) * Math.cos(lati2) * Math.cos(long1 - long1) + Math.sin(lati1) * Math.sin(lati2)))
  },[movesbase])

  const polygonData = movedData.filter((x:any)=>(x.coordinates || x.polygon))
  const heatmapData = state.heatmapVisible ? movedData.reduce((heatmapData:any,x:MovedData)=>{
    if(x.position){
      const heatmapArea_long = state.heatmapArea * distance_rate[0]
      const heatmapArea_lati = state.heatmapArea * distance_rate[1]
      const Grid_longitude = Math.floor(x.position[0]/heatmapArea_long)*heatmapArea_long
      const Grid_latitude = Math.floor(x.position[1]/heatmapArea_lati)*heatmapArea_lati
      const findIdx = heatmapData.findIndex((x:any)=>(x.Grid_longitude === Grid_longitude && x.Grid_latitude === Grid_latitude))
      if(findIdx < 0){
        heatmapData.push({
          Grid_longitude, Grid_latitude, elevation:1,
          coordinates:[
            [Grid_longitude, Grid_latitude],[Grid_longitude+heatmapArea_long, Grid_latitude],
            [Grid_longitude+heatmapArea_long, Grid_latitude+heatmapArea_lati],
            [Grid_longitude, Grid_latitude+heatmapArea_lati]
          ]
        })
      }else{
        heatmapData[findIdx].elevation = heatmapData[findIdx].elevation + 1
      }
    }
    return heatmapData
  },[]):[]
  const heatmapMaxValue = state.heatmapVisible ? heatmapData.reduce((heatmapMaxValue:any,x:any)=>{
    return Math.max(heatmapMaxValue,x.elevation)
  },0):0
  const PointCloudData = movedData.filter((x:any)=>x.pointCloud)
  const sizeScale = React.useMemo(()=>(Math.max(17 - viewport.zoom,2)**2)*2,[viewport.zoom]);
  const followingiconId = iconFollowRef.current === undefined ? -1 : iconFollowRef.current.followingiconId

  return (
    <IconFollow ref={iconFollowRef} {...props}>
      <Controller
        {...props} status={state}
        mapStyleNo={state.mapStyleNo}
        iconCubeType={state.iconCubeType}
        followingiconId={followingiconId}
        getMapboxChecked={getMapboxChecked}
        getMapStyleSelected={getMapStyleSelected}
        getTerrainChecked={getTerrainChecked}
        getMoveDataChecked={getMoveDataChecked}
        getMoveOptionChecked={getMoveOptionChecked}
        getMoveOptionArcChecked={getMoveOptionArcChecked}
        getMoveOptionLineChecked={getMoveOptionLineChecked}
        getMoveSvgChecked={getMoveSvgChecked}
        getDepotOptionChecked={getDepotOptionChecked}
        getHeatmapVisible={getHeatmapVisible}
        heatmapArea={state.heatmapArea}
        getHeatmapArea={getHeatmapArea}
        getOptionChangeChecked={getOptionChangeChecked}
        getIconChangeChecked={getIconChangeChecked}
        getIconCubeTypeSelected={getIconCubeTypeSelected}
        getFollowingiconIdSelected={getFollowingiconIdSelected}
        getViewport={getViewport}
      />
      <div className="harmovis_footer">
        longitude:{viewport.longitude}&nbsp;
        latitude:{viewport.latitude}&nbsp;
        altitude:{viewport.altitude}&nbsp;
        zoom:{viewport.zoom}&nbsp;
        bearing:{viewport.bearing}&nbsp;
        pitch:{viewport.pitch}
      </div>
      <div className="harmovis_area">
        <HarmoVisLayers
          deckGLProps={{onLoad:onLoad}}
          viewport={viewport}
          actions={actions}
          mapboxApiAccessToken={MAPBOX_TOKEN}
          mapStyle={state.mapboxVisible ? mapStyle[state.mapStyleNo] : ''}
          mapboxAddSourceValue={undefined}
          visible={state.mapboxVisible}
          terrain={state.terrain}
          layers={[].concat(
            depotsData.length > 0 ?
            new DepotsLayer({
              depotsData,
              /* iconDesignations Setting Example
              iconDesignations: [{type:'stop', layer:'Scatterplot'},{type:'station', layer:'SimpleMesh'}],
              /**/
              optionVisible: state.depotOptionVisible,
              optionChange: state.optionChange,
              iconChange: state.iconChange,
              onHover
            }):null,
            state.moveDataVisible && movedData.length > 0 ?
            new MovesLayer({
              // scenegraph,
              routePaths,
              movedData,
              movesbase,
              /* iconDesignations Setting Example
              iconDesignations:[{type:'car', layer:'SimpleMesh', getColor:()=>[255,0,0,255]},
              {type:'bus', layer:'Scenegraph', getScale:()=>[0.2,0.2,0.2], getOrientation:()=>[0,0,90]},
              {type:'walker', layer:'Scatterplot'},],
              /**/
              clickedObject,
              actions,
              visible: state.moveDataVisible,
              optionVisible: state.moveOptionVisible,
              optionArcVisible: state.moveOptionArcVisible,
              optionLineVisible: state.moveOptionLineVisible,
              optionChange: state.optionChange,
              iconChange: state.iconChange, // Invalid if there is iconDesignations definition
              iconCubeType: state.iconCubeType, // Invalid if there is iconDesignations definition
              sizeScale: state.iconCubeType === 0 ? sizeScale : (sizeScale/10),
              onHover
            }):null,
            linemapData.length > 0 ?
            new LineMapLayer({
              id: 'line-map',
              data: linemapData,
              onHover
            }):null,
            polygonData.length > 0  ?
            new PolygonLayer({
              id: 'PolygonLayer',
              data: polygonData,
              visible: true,
              opacity: 0.5,
              pickable: true,
              extruded: true,
              wireframe: true,
              getPolygon: (x: any) => x.coordinates || x.polygon,
              getFillColor: (x: any) => x.color || [255,255,255,255],
              getLineColor: null,
              getElevation: (x: any) => x.elevation || 3,
              onHover 
            }):null,
            PointCloudData.length > 0 ? getPointCloudLayer(PointCloudData):null,
            state.heatmapVisible && heatmapData.length > 0 ?
            new PolygonLayer({
              id: 'HeatmapPolygonLayer',
              data: heatmapData,
              visible: true,
              opacity: 0.5,
              pickable: true,
              extruded: true,
              wireframe: false,
              getPolygon: (x: any) => x.coordinates,
              getFillColor: (x: any) => heatmapColor[Math.min(4,Math.floor(x.elevation/(heatmapMaxValue/Math.min(heatmapMaxValue,heatmapColor.length))))],
              getLineColor: null,
              getElevation: (x: any) => x.elevation || 0,
              elevationScale: 100,
              onHover 
            }):null,
          )}
          mapGlComponents={ getMapGlComponents(movedData) }
        />
      </div>
      <svg width={viewport.width} height={viewport.height} className="harmovis_overlay">
        <g fill="white" fontSize="12">
          {state.popup[2].length > 0 ?
            state.popup[2].split('\n').map((value:any, index:number) =>
              <text
                x={state.popup[0] + 10} y={state.popup[1] + (index * 12)}
                key={index.toString()}
              >{value}</text>) : null
          }
        </g>
      </svg>
      <LoadingIcon loading={loading} />
      <FpsDisplay />
    </IconFollow>
  );
}
App.playbackTimerId = null as NodeJS.Timeout

export default connectToHarmowareVis(App);
