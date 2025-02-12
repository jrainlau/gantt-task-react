import React, { memo, useCallback } from "react";
import { TaskGanttContentProps } from "../gantt/task-gantt-content";
import { EditableTaskInfo } from "../../types/public-types";
import { GridProps } from "../grid/grid";

type HoverableCellProps = {
  x: number;
  y: number;
  width: number;
  height: number;
  selectedCellPos: [number, number];
  gridProps: GridProps;
  barProps: TaskGanttContentProps;
  onClick: (editableTaskInfo: EditableTaskInfo) => void;
}

const HoverableCellInner: React.FC<HoverableCellProps> = ({
  x,
  y,
  width,
  height,
  selectedCellPos: [selectedCellX, selectedCellY],
  gridProps: { getDate },
  barProps: { mapGlobalRowIndexToTask },
  onClick,
}) => {
  const onCellClick = useCallback(() => {
    const task = mapGlobalRowIndexToTask.get(selectedCellY);
    const start = getDate(selectedCellX);
    const end = getDate(selectedCellX + 1);
    onClick({ task, start, end });
  }, [mapGlobalRowIndexToTask, selectedCellY, getDate, selectedCellX, onClick]);

  return (
    <svg x={x} y={y} width={width} height={height} xmlns="http://www.w3.org/2000/svg" onClick={onCellClick}>
      <rect x="5" y="5" width={ width - 10 } height={ height - 10 } fill="transparent" />
      <rect x="5" y="5" width={ width - 10 } height={ height - 10 } stroke="gray" stroke-dasharray="5 5" fill="none"/>
      <line x1={ width / 2 } y1={ 15 } x2={ width / 2 } y2={ height - 15 } stroke="gray" stroke-width="2"/>
      <line x1="20" y1={ height / 2 } x2={ width - 20 } y2={ height / 2 } stroke="gray" stroke-width="2"/>
    </svg>
  )
}

export const HoverableCell = memo(HoverableCellInner);
