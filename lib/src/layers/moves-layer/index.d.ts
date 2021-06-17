import { LayerProps, CompositeLayer } from '@deck.gl/core';
import { CubeGeometry } from '@luma.gl/engine';
import { pickParams } from '../../library';
import { RoutePaths, MovedData, Movesbase, ClickedObject, LayerTypes, IconDesignation } from '../../types';
import * as Actions from '../../actions';
interface Props extends LayerProps {
    routePaths: RoutePaths[];
    layerRadiusScale?: number;
    layerOpacity?: number;
    movedData: MovedData[];
    movesbase: Movesbase[];
    clickedObject: null | ClickedObject[];
    actions: typeof Actions;
    optionVisible?: boolean;
    optionArcVisible?: boolean;
    optionLineVisible?: boolean;
    optionChange?: boolean;
    optionOpacity?: number;
    optionCellSize?: number;
    optionElevationScale?: number;
    optionCentering?: boolean;
    optionDisplayPosition?: number;
    iconlayer?: LayerTypes;
    iconChange?: boolean;
    iconCubeType?: number;
    iconDesignations?: IconDesignation[];
    getRouteColor?: (x: MovedData) => number[];
    getRouteWidth?: (x: MovedData) => number;
    getRadius?: (x: MovedData) => number;
    getCubeColor?: (x: MovedData) => number[][];
    getCubeElevation?: (x: MovedData) => number[];
    getArchWidth?: (x: MovedData) => number;
    getLinehWidth?: (x: MovedData) => number;
    scenegraph?: any;
    mesh?: any;
    sizeScale?: number;
    getOrientation?: (x: MovedData) => number[];
    getScale?: (x: MovedData) => number[];
    getTranslation?: (x: MovedData) => number[];
}
export default class MovesLayer extends CompositeLayer<Props> {
    constructor(props: Props);
    static defaultProps: {
        id: string;
        layerRadiusScale: number;
        layerOpacity: number;
        optionVisible: boolean;
        optionLineVisible: boolean;
        optionChange: boolean;
        optionOpacity: number;
        optionCellSize: number;
        optionElevationScale: number;
        optionCentering: boolean;
        optionDisplayPosition: number;
        visible: boolean;
        iconChange: boolean;
        iconCubeType: number;
        getRouteColor: (x: MovedData) => (number | number[])[];
        getRouteWidth: (x: MovedData) => number;
        getRadius: (x: MovedData) => number;
        getCubeColor: (x: MovedData) => (number | number[])[][];
        getCubeElevation: (x: MovedData) => number[];
        getArchWidth: (x: MovedData) => number;
        getLinehWidth: (x: MovedData) => number;
        scenegraph: string;
        mesh: CubeGeometry;
        sizeScale: number;
        getOrientation: (x: MovedData) => number[];
        getScale: (x: MovedData) => number[];
        getTranslation: number[];
    };
    static layerName: string;
    getPickingInfo(pickParams: pickParams): void;
    getIconLayer(movedData: MovedData[]): any[];
    renderLayers(): any[];
}
export {};
