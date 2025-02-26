import React, { CSSProperties, ReactNode, RefObject, memo, useMemo } from "react";
import { TaskGanttContentProps } from "../gantt/task-gantt-content";
import { TaskItemPosMap } from "../gantt/task-gantt";
import { Task } from "../../types/public-types";

type QuickLocateBtnsProps = {
  fullRowHeight: number;
  barProps: TaskGanttContentProps;
  taskItemPosMap: TaskItemPosMap;
  scrollToTask: (task: Task) => void;
  selectTask: (taskId: string) => void;
  ganttFullHeight: number;
  ganttTaskRootRef: RefObject<HTMLDivElement>;
}

const QuickLocateBtnsInner: React.FC<QuickLocateBtnsProps> = ({
  fullRowHeight,
  barProps,
  taskItemPosMap,
  scrollToTask,
  selectTask,
  ganttFullHeight,
  ganttTaskRootRef,
}) => {
  const wrapperStyle: CSSProperties = useMemo(() => {
    if (!ganttTaskRootRef.current) return {};
    const { top, left, width, height } = ganttTaskRootRef.current.getBoundingClientRect();
    return {
      position: 'fixed',
      top: top + 56,
      left,
      width,
      height: height - 56,
      pointerEvents: 'none',
      overflow: 'hidden'
    }
  }, [ganttTaskRootRef.current]);

  const renderQuickLocateBtns = useMemo(() => {
    if (!barProps.renderedRowIndexes) {
      return [];
    }

    const BTN_WIDTH = 60;
    const [start, end] = barProps.renderedRowIndexes;

    const quickLocateBtnsRes: ReactNode[] = [];

    for (let index = start; index <= end; ++index) {
      const task = barProps.mapGlobalRowIndexToTask.get(index);

      if (!task) {
        continue;
      }

      const { comparisonLevel = 1 } = task;

      if (comparisonLevel > barProps.comparisonLevels) {
        continue;
      }

      if (task.type === "empty") {
        continue;
      }

      if (!taskItemPosMap.left.has(task.id) && !taskItemPosMap.right.has(task.id)) {
        continue;
      }

      const key = `${comparisonLevel}_${task.id}`;

      const {
        levelY,
      } = barProps.getTaskCoordinates(task);

      const svgY = levelY;

      const btnStyle: CSSProperties = {
        position: 'absolute',
        top: svgY,
        zIndex: 1,
        pointerEvents: 'auto',
        ...(taskItemPosMap.right.has(task.id) ? { right: 0 } : { left: 0 }),
      }

      quickLocateBtnsRes.push(
        <svg
          id={task.id}
          style={btnStyle}
          width={BTN_WIDTH}
          height={fullRowHeight}
          key={key}
          onClick={() => {
            scrollToTask(task)
            selectTask(task.id)
          }}
        >
          <rect x="5" y="5" width={ 50 } height={ 40 } fill="transparent" />
          <rect x="5" y="5" width={ 50 } height={ 40 } stroke="gray" stroke-dasharray="5 5" fill="none"/>
          <line x1={ 30 } y1={ 15 } x2={ 30 } y2={ 35 } stroke="gray" stroke-width="2"/>
          <line x1="20" y1={ 25 } x2={ 40 } y2={ 25 } stroke="gray" stroke-width="2"/>
        </svg>
      );
    }

    return quickLocateBtnsRes;
  }, [
    fullRowHeight,
    barProps,
    taskItemPosMap,
  ]);

  return (
    <div style={wrapperStyle}>
     <div style={{ position: 'relative', transform: `translateY(var(--gantt-scroll-top))`, width: '100%', height: ganttFullHeight }}>
      { renderQuickLocateBtns }
     </div>
    </div>
  )
}

export const QuickLocateBtns = memo(QuickLocateBtnsInner);
