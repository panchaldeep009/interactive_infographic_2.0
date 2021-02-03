import React, { useEffect, useMemo, useState } from 'react';
import randomColors from 'randomcolor';
import { CircleOptions, ColorOptions, Petal, Position, Root } from './types';
import { Legend, LegendOptions } from './Legend';
import { Roots, RootsOptions } from './Roots';
import { Petals, PetalsOptions } from './Petals';
import { Connections } from './Connections';
export interface GraphProps<Data extends Record<string | number, unknown>> extends ColorOptions {
  data: Data[],
  width?: number,
  height?: number,
  fontSize?: number,
  graphRotation?: number,
  offFocuseOpacity?: number,
  rootsOptions?: RootsOptions,
  legendOptions?: LegendOptions,
  petalsOptions?: PetalsOptions,
  graphPosition?: Partial<Position>,
  innerCircle?: Partial<CircleOptions>
  labelAccessor: ((data: Data) => string),
  typeAccessor: ((data: Data) => string[]),
  onHoverLabel?: (label: string) => void,
  onHoverTypes?: (types: string[]) => void,
}

type GraphComponent = <
  D extends Record<string | number, unknown>,
>(props: GraphProps<D>) => ReturnType<React.FC>;


export const Graph: GraphComponent = ({
  data,
  typeAccessor,
  labelAccessor,
  hue,
  legendOptions,
  petalsOptions,
  rootsOptions,
  graphPosition: graphPositionProp,
  width = 600,
  height = 700,
  luminosity = 'bright',
  fontSize = 6,
  offFocuseOpacity = 0.4,
  graphRotation = 45,
  innerCircle,
  onHoverTypes,
  onHoverLabel
}) => {
  const [hoveredlabel, setHoveredLabel] = useState<string>(undefined);
  const [hoveredTypes, setHoveredTypes] = useState<string[]>([]);
  const [roots, updateRoots] = useState<Root[]>([]);
  const [petals, updatePetals] = useState<Petal[]>([]);

  useEffect(() => {
    if (onHoverTypes) {
      onHoverTypes(hoveredTypes)
    }
  }, [onHoverTypes, hoveredTypes]);
  
  useEffect(() => {
    if (onHoverLabel) {
      onHoverLabel(hoveredlabel)
    }
  }, [onHoverLabel, hoveredlabel]);
  

  const graphPosition = useMemo(() => ({
    x: graphPositionProp.x || width / 2,
    y: graphPositionProp.y || ((height - 100) / 2) + 100
  }), [graphPositionProp, height, width])

  const types = useMemo(() => 
    data
      .reduce((acc, current) => ([...acc, ...(typeAccessor(current))]), [] as string[])
      .filter((type, index, allData) => allData.indexOf(type) === index)
  , [data, typeAccessor]);

  const typesColors = useMemo(() => randomColors({ 
    count: types.length,
    luminosity,
    hue,
   }), [hue, luminosity, types.length]);

  const legendData = useMemo(() => 
    types
      .map((type, index) => ({ 
        type,
        color: typesColors[index], 
        count: data.filter(d => typeAccessor(d).includes(type)).length
      }))
      .sort((a, b) => b.count - a.count)
  , [typesColors, types, data, typeAccessor]);

  const mappedData = useMemo(() => data.map((data) => ({
    label: labelAccessor(data),
    types: legendData.filter(({ type }) => (typeAccessor(data) || []).includes(type))
  })), [data, typeAccessor, labelAccessor, legendData]);

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="100%"
      height="100%"
      style={{ position: "relative", fontFamily: 'sans-serif' }}
      viewBox={`0 0 ${600} ${700}`}
    >
      <Legend
        types={legendData}
        fontSize={fontSize}
        luminosity={luminosity}
        legendOptions={legendOptions}
        hoveredLegends={hoveredTypes}
        offFocuseOpacity={offFocuseOpacity}
        onLegendHover={setHoveredTypes}
        onLegendBlur={() => setHoveredTypes([])}
      />
      <g
        name="Graph"
        transform={`
          rotate(
            ${graphRotation},
            ${graphPosition.x},
            ${graphPosition.y}
          )
        `}
      >
        <Connections
          roots={roots}
          petals={petals}
          hoveredConnections={hoveredTypes}
          hoveredLabel={hoveredlabel}
        />
        <Petals
          data={mappedData}
          innerCircle={innerCircle}
          position={graphPosition}
          options={petalsOptions}
          fontSize={fontSize}
          updatePetals={updatePetals}
          hoveredLabel={hoveredlabel}
          hoveredTypes={hoveredTypes}
          onLabelHover={setHoveredLabel}
          onTypeHover={setHoveredTypes}
          onLabelBlur={() => setHoveredLabel(undefined)}
          onTypeBlur={() => setHoveredTypes([])}
          offFocuseOpacity={offFocuseOpacity}
        />
        <Roots 
          types={legendData}
          offFocuseOpacity={offFocuseOpacity}
          options={rootsOptions}
          position={graphPosition}
          hoveredRoots={hoveredTypes}
          onRootHover={setHoveredTypes}
          onRootBlur={() => setHoveredTypes([])}
          updateRoots={updateRoots}
        />
      </g>
    </svg>
  );
}

export default Graph;
