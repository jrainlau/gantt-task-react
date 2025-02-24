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
  ganttTaskContentRef: RefObject<HTMLDivElement>;
  ganttTaskRootRef: RefObject<HTMLDivElement>;
}

const QuickLocateBtnsInner: React.FC<QuickLocateBtnsProps> = ({
  fullRowHeight,
  barProps,
  taskItemPosMap,
  scrollToTask,
  selectTask,
  ganttTaskContentRef,
  ganttTaskRootRef,
}) => {
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

      const svgY = ganttTaskContentRef.current.getBoundingClientRect().y + levelY;
      const rootRect = ganttTaskRootRef.current.getBoundingClientRect();
      const svgX = taskItemPosMap.left.has(task.id) ? rootRect.x : rootRect.width + rootRect.x - BTN_WIDTH;

      const btnStyle: CSSProperties = {
        position: 'fixed',
        top: svgY,
        left: svgX,
        transform: `translateY(var(--gantt-scroll-top))`,
      }

      quickLocateBtnsRes.push(
        <svg
          id={task.id}
          style={btnStyle}
          width={BTN_WIDTH}
          height={fullRowHeight}
          data-xxx={ganttTaskContentRef.current.scrollTop}
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
    <>
     { renderQuickLocateBtns }
    </>
  )
}

export const QuickLocateBtns = memo(QuickLocateBtnsInner);
