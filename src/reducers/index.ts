import { analyzeMovesBase, getMoveObjects, getDepots, calcLoopTime } from '../library';
import { reducerWithInitialState } from "typescript-fsa-reducers";
import { InnerState, AnalyzedBaseData } from '../types';
import { addMinutes, setViewport, setDefaultViewport, setTimeStamp, 
  setTime, increaseTime, decreaseTime, setLeading, setTrailing, setFrameTimestamp, setMovesBase, setDepotsBase, 
  setAnimatePause, setAnimateReverse, setSecPerHour, setClicked, 
  setRoutePaths, setDefaultPitch, setMovesOptionFunc, setDepotsOptionFunc, 
  setLinemapData, setLoading, setInputFilename, updateMovesBase, setNoLoop,
  setInitialViewChange, setIconGradationChange } from '../actions';

const initialState: InnerState = {
  viewport: {
    longitude: 136.906428,
    latitude: 35.181453,
    zoom: 11.1,
    maxZoom: 18,
    minZoom: 5,
    pitch: 30,
    bearing: 0,
    maxPitch: undefined,
    minPitch: undefined,
    width: window.innerWidth, // 共通
    height: window.innerHeight, // 共通
    transitionDuration: undefined,
    transitionInterpolator: undefined,
    transitionInterruption: undefined,
  },
  settime: 0,
  starttimestamp: 0,
  timeLength: 0,
  timeBegin: 0,
  loopTime: 0,
  leading: 100,
  trailing: 180,
  beforeFrameTimestamp: 0,
  movesbase: [],
  depotsBase: [],
  bounds: {
    westlongitiude: 0,
    eastlongitiude: 0,
    southlatitude: 0,
    northlatitude: 0
  },
  animatePause: false,
  loopEndPause: false,
  animateReverse: false,
  secperhour: 180,
  clickedObject: null,
  routePaths: [],
  defaultZoom: 11.1,
  defaultPitch: 30,
  getMovesOptionFunc: null,
  getDepotsOptionFunc: null,
  movedData: [],
  depotsData: [],
  linemapData: [],
  loading: false,
  inputFileName: {},
  noLoop: false,
  initialViewChange: true,
  iconGradation: false
};

const reducer = reducerWithInitialState<InnerState>(initialState);
const assign = Object.assign;

reducer.case(addMinutes, (state, min) => {
  const assignData:InnerState = {};
  assignData.loopEndPause = false;
  assignData.settime = state.settime + (min * 60);
  if (assignData.settime < (state.timeBegin - state.leading)) {
    assignData.settime = (state.timeBegin - state.leading);
  }
  if (assignData.settime > (state.timeBegin + state.timeLength)) {
    assignData.settime = (state.timeBegin + state.timeLength);
  }
  assignData.starttimestamp = Date.now() -
    (((assignData.settime - state.timeBegin) / state.timeLength) * state.loopTime);
  return assign({}, state, assignData);
});

reducer.case(setViewport, (state, view) => {
  const viewport = assign({}, state.viewport, view);
  return assign({}, state, {
    viewport
  });
});

reducer.case(setDefaultViewport, (state, defViewport:{defaultZoom?:number,defaultPitch?:number}={}) => {
  const {defaultZoom,defaultPitch} = defViewport;
  const zoom = defaultZoom||state.defaultZoom;
  const pitch = defaultPitch||state.defaultPitch;
  const viewport = assign({}, state.viewport, { bearing:0, zoom, pitch });
  return assign({}, state, {
    viewport, defaultZoom:zoom, defaultPitch:pitch
  });
});

reducer.case(setTimeStamp, (state, props) => {
  const starttimestamp = (Date.now() + calcLoopTime(state.leading, state.secperhour));
  return assign({}, state, {
    starttimestamp, loopEndPause:false
  });
});

reducer.case(setTime, (state, settime) => {
  const starttimestamp = Date.now() - (((settime - state.timeBegin) / state.timeLength) * state.loopTime);
  return assign({}, state, {
    settime, starttimestamp, loopEndPause:false
  });
});

reducer.case(increaseTime, (state, props) => {
  const assignData:InnerState = {};
  const beforeSettime = state.settime;
  const now = Date.now();
  if ((now - state.starttimestamp) >= state.loopTime) {
    if(!state.noLoop){
      console.log('settime overlap.');
      assignData.settime = (state.timeBegin - state.leading);
      assignData.starttimestamp = now - (((assignData.settime - state.timeBegin) / state.timeLength) * state.loopTime);
      const setProps = { ...props, ...assignData };
      assignData.movedData = getMoveObjects(setProps);
      if(assignData.movedData.length === 0){
        assignData.clickedObject = null;
        assignData.routePaths = [];
      }
      if(state.depotsBase.length <= 0 || state.depotsData.length <= 0 || state.getDepotsOptionFunc){
        assignData.depotsData = getDepots(setProps);
      }
      return assign({}, state, assignData);
    }else{
      return assign({}, state, {loopEndPause:true});
    }
  }else{
    assignData.settime = ((((now - state.starttimestamp) % state.loopTime) /
      state.loopTime) * state.timeLength) + state.timeBegin;
  }
  if (beforeSettime > assignData.settime) {
    console.log(`${beforeSettime} ${assignData.settime}`);
  }
  assignData.beforeFrameTimestamp = now;
  const setProps = { ...props, ...assignData };
  assignData.movedData = getMoveObjects(setProps);
  if(assignData.movedData.length === 0){
    assignData.clickedObject = null;
    assignData.routePaths = [];
  }
  if(state.depotsBase.length <= 0 || state.depotsData.length <= 0 || state.getDepotsOptionFunc){
    assignData.depotsData = getDepots(setProps);
  }
  return assign({}, state, assignData);
});

reducer.case(decreaseTime, (state, props) => {
  const now = Date.now();
  const beforeFrameElapsed = now - state.beforeFrameTimestamp;
  const assignData:InnerState = {};
  assignData.starttimestamp = state.starttimestamp + (beforeFrameElapsed * 2);
  assignData.settime = ((((now - state.starttimestamp) % state.loopTime) /
    state.loopTime) * state.timeLength) + state.timeBegin;
  if (assignData.settime <= (state.timeBegin - state.leading)) {
    if(state.noLoop){
      return assign({}, state, {loopEndPause:true});
    }
    assignData.settime = state.timeBegin + state.timeLength;
    assignData.starttimestamp = now - (((assignData.settime - state.timeBegin) / state.timeLength) * state.loopTime);
  }
  assignData.beforeFrameTimestamp = now;
  const setProps = { ...props, ...assignData };
  assignData.movedData = getMoveObjects(setProps);
  if(assignData.movedData.length === 0){
    assignData.clickedObject = null;
    assignData.routePaths = [];
  }
  if(state.depotsBase.length <= 0 || state.depotsData.length <= 0 || state.getDepotsOptionFunc){
    assignData.depotsData = getDepots(setProps);
  }
  return assign({}, state, assignData);
});

reducer.case(setLeading, (state, leading) => {
  return assign({}, state, {
    leading
  });
});

reducer.case(setTrailing, (state, trailing) => {
  return assign({}, state, {
    trailing
  });
});

reducer.case(setFrameTimestamp, (state, props) => {
  const assignData:InnerState = {};
  const now = Date.now();
  assignData.beforeFrameTimestamp = now;
  assignData.starttimestamp = now - (((state.settime - state.timeBegin) / state.timeLength) * state.loopTime);
  const setProps = { ...props, ...assignData };
  assignData.movedData = getMoveObjects(setProps);
  if(assignData.movedData.length === 0){
    assignData.clickedObject = null;
    assignData.routePaths = [];
  }
  if(state.depotsBase.length <= 0 || state.depotsData.length <= 0 || state.getDepotsOptionFunc){
    assignData.depotsData = getDepots(setProps);
  }
  return assign({}, state, assignData);
});

reducer.case(setMovesBase, (state, base) => {
  const analyzeData:Readonly<AnalyzedBaseData> = analyzeMovesBase(base);
  const assignData:InnerState = {};
  assignData.loopEndPause = false;
  assignData.timeBegin = analyzeData.timeBegin;
  assignData.bounds = analyzeData.bounds;
  if(state.initialViewChange && analyzeData.movesbase.length > 0){
    assignData.viewport = assign({}, state.viewport,
      {bearing:0, zoom:state.defaultZoom, pitch:state.defaultPitch}, analyzeData.viewport);
  }
  assignData.settime =
    analyzeData.timeBegin - (analyzeData.movesbase.length === 0 ? 0 : state.leading);
  if (analyzeData.timeLength > 0) {
    assignData.timeLength = analyzeData.timeLength + state.trailing;
  }else{
    assignData.timeLength = analyzeData.timeLength;
  }
  assignData.loopTime = calcLoopTime(assignData.timeLength, state.secperhour);
  // starttimestampはDate.now()の値でいいが、スタート時はleading分の余白時間を付加する
  assignData.starttimestamp = Date.now() + calcLoopTime(state.leading, state.secperhour);
  if(state.depotsBase.length <= 0 || state.depotsData.length <= 0 || state.getDepotsOptionFunc){
    assignData.depotsData = getDepots({ ...state, bounds:analyzeData.bounds });
  }
  assignData.movesbase = analyzeData.movesbase;
  assignData.movedData = [];
  return assign({}, state, assignData);
});

reducer.case(setDepotsBase, (state, depotsBase) => {
  const assignData:InnerState = {};
  assignData.depotsBase = depotsBase;
  if(state.depotsBase.length <= 0 || state.depotsData.length <= 0 || state.getDepotsOptionFunc){
    assignData.depotsData = getDepots({ ...state, depotsBase });
  }
  return assign({}, state, assignData);
});

reducer.case(setAnimatePause, (state, animatePause) => {
  const assignData:InnerState = {};
  assignData.animatePause = animatePause;
  assignData.loopEndPause = false;
  assignData.starttimestamp = (Date.now() - (((state.settime - state.timeBegin) / state.timeLength) * state.loopTime));
  return assign({}, state, assignData);
});

reducer.case(setAnimateReverse, (state, animateReverse) => {
  return assign({}, state, {
    animateReverse, loopEndPause:false
  });
});

reducer.case(setSecPerHour, (state, secperhour) => {
  const assignData:InnerState = {};
  assignData.loopEndPause = false;
  assignData.secperhour = secperhour;
  assignData.loopTime = calcLoopTime(state.timeLength, secperhour);
  if (!state.animatePause) {
    assignData.starttimestamp =
      (Date.now() - (((state.settime - state.timeBegin) / state.timeLength) * assignData.loopTime));
  }
  return assign({}, state, assignData);
});

reducer.case(setClicked, (state, clickedObject) => {
  return assign({}, state, {
    clickedObject
  });
});

reducer.case(setRoutePaths, (state, routePaths) => {
  return assign({}, state, {
    routePaths
  });
});

reducer.case(setDefaultPitch, (state, defaultPitch) => {
  return assign({}, state, {
    defaultPitch
  });
});

reducer.case(setMovesOptionFunc, (state, getMovesOptionFunc) => {
  return assign({}, state, {
    getMovesOptionFunc
  });
});

reducer.case(setDepotsOptionFunc, (state, getDepotsOptionFunc) => {
  return assign({}, state, {
    getDepotsOptionFunc
  });
});

reducer.case(setLinemapData, (state, linemapData) => {
  return assign({}, state, {
    linemapData
  });
});

reducer.case(setLoading, (state, loading) => {
  return assign({}, state, {
    loading
  });
});

reducer.case(setInputFilename, (state, fileName) => {
  const inputFileName = assign({}, state.inputFileName, fileName);
  return assign({}, state, {
    inputFileName
  });
});

reducer.case(updateMovesBase, (state, base) => {
  const analyzeData:Readonly<AnalyzedBaseData> = analyzeMovesBase(base);
  const assignData:InnerState = {};
  assignData.loopEndPause = false;
  if(state.movesbase.length === 0 || analyzeData.timeLength === 0){ //初回？
    assignData.timeBegin = analyzeData.timeBegin;
    assignData.timeLength = analyzeData.timeLength;
    assignData.bounds = analyzeData.bounds;
    assignData.movesbase = analyzeData.movesbase;
    assignData.movedData = [];
    assignData.settime = analyzeData.timeBegin - state.leading;
    if (assignData.timeLength > 0) {
      assignData.timeLength = assignData.timeLength + state.trailing;
    }
    assignData.loopTime = calcLoopTime(assignData.timeLength, state.secperhour);
    // starttimestampはDate.now()の値でいいが、スタート時はleading分の余白時間を付加する
    assignData.starttimestamp = Date.now() + calcLoopTime(state.leading, state.secperhour);
    if(state.initialViewChange && analyzeData.movesbase.length > 0){
      assignData.viewport = assign({}, state.viewport,
        {bearing:0, zoom:state.defaultZoom, pitch:state.defaultPitch}, analyzeData.viewport);
    }
    if(state.depotsBase.length <= 0 || state.depotsData.length <= 0 || state.getDepotsOptionFunc){
      assignData.depotsData = getDepots({ ...state, ...assignData });
    }
    return assign({}, state, assignData);
  }

  assignData.movesbase = analyzeData.movesbase;
  assignData.movedData = [];
  const startState:InnerState = {};
  startState.timeLength = analyzeData.timeLength;
  if (startState.timeLength > 0) {
    startState.timeLength = startState.timeLength + state.trailing;
  }
  if(analyzeData.timeBegin !== state.timeBegin || startState.timeLength !== state.timeLength){
    startState.timeBegin = analyzeData.timeBegin;
    startState.loopTime = calcLoopTime(startState.timeLength, state.secperhour);
    startState.starttimestamp =
      (Date.now() - (((state.settime - startState.timeBegin) / startState.timeLength) * startState.loopTime));
    return assign({}, state, startState, assignData);
  }
  return assign({}, state, assignData);
});

reducer.case(setNoLoop, (state, noLoop) => {
  return assign({}, state, {
    noLoop, loopEndPause:false
  });
});

reducer.case(setInitialViewChange, (state, initialViewChange) => {
  return assign({}, state, {
    initialViewChange
  });
});

reducer.case(setIconGradationChange, (state, iconGradation) => {
  return assign({}, state, {
    iconGradation
  });
});

reducer.default((state) => state);

export default reducer.build();
