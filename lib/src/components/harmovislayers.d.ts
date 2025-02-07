/// <reference types="react" />
/// <reference types="mapbox-gl" />
import { InteractiveMapProps } from 'react-map-gl';
import { Layer } from '@deck.gl/core';
import { ActionTypes, Viewport } from '../types';
interface Props extends InteractiveMapProps {
    mapboxApiAccessToken: string;
    viewport: Viewport;
    actions: ActionTypes;
    layers: Layer[];
    mapGlComponents?: any;
    mapboxAddLayerValue?: mapboxgl.AnyLayer[];
    mapboxAddSourceValue?: {
        id: string;
        source: mapboxgl.AnySourceData;
    }[];
    terrain: boolean;
    terrainSource: {
        id: string;
        source: mapboxgl.AnySourceData;
    };
    setTerrain: mapboxgl.TerrainSpecification;
    deckGLProps?: object;
}
declare const HarmoVisLayers: {
    (props: Partial<Props>): JSX.Element;
    defaultProps: {
        visible: boolean;
        mapStyle: string;
        mapGlComponents: any;
        mapboxAddLayerValue: ({
            id: string;
            source: string;
            "source-layer": string;
            filter: string[];
            type: string;
            paint: {
                "fill-extrusion-color": string;
                "fill-extrusion-height": (string | number | string[])[];
                "fill-extrusion-base": (string | number | string[])[];
                "fill-extrusion-opacity": number;
                'sky-type'?: undefined;
                'sky-atmosphere-sun'?: undefined;
                'sky-atmosphere-sun-intensity'?: undefined;
            };
        } | {
            id: string;
            type: string;
            paint: {
                'sky-type': string;
                'sky-atmosphere-sun': number[];
                'sky-atmosphere-sun-intensity': number;
                "fill-extrusion-color"?: undefined;
                "fill-extrusion-height"?: undefined;
                "fill-extrusion-base"?: undefined;
                "fill-extrusion-opacity"?: undefined;
            };
            source?: undefined;
            "source-layer"?: undefined;
            filter?: undefined;
        })[];
        terrain: boolean;
        terrainSource: {
            id: string;
            source: {
                type: string;
                url: string;
            };
        };
        setTerrain: {
            source: string;
        };
        transitionDuration: number;
        deckGLProps: {};
    };
};
export default HarmoVisLayers;
