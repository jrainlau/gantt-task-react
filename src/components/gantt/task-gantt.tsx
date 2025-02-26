import React, { createContext, memo, SyntheticEvent, useContext, useMemo } from "react";
import type { CSSProperties, RefObject } from "react";

import { GridProps, Grid } from "../grid/grid";
import { CalendarProps, Calendar } from "../calendar/calendar";
import { TaskGanttContentProps, TaskGanttContent } from "./task-gantt-content";
import styles from "./gantt.module.css";
import Popper from "@mui/material/Popper";
import Paper from "@mui/material/Paper";
import {
  TaskContextualPaletteProps,
  Task,
  Distances,
  DateExtremity,
  TaskDependencyContextualPaletteProps, ColorStyles, EditableTaskInfo
} from "../../types/public-types";
import ClickAwayListener from "@mui/material/ClickAwayListener";
import { HoverableCell } from "../other/hoverable-cell";
import { QuickLocateBtns } from "../other/quick-locate-btns";

export type TaskItemPosMap = {
  left: Set<string>;
  right: Set<string>;
}

type ScrollContextType = {
  observer: IntersectionObserver | null;
}

const ScrollContext = createContext<ScrollContextType>({
  observer: null,
});

export const useScroll = () => {
  return useContext(ScrollContext);
};

export type TaskGanttProps = {
  barProps: TaskGanttContentProps;
  calendarProps: CalendarProps;
  gridProps: GridProps;
  distances: Distances;
  fullRowHeight: number;
  fullSvgWidth: number;
  ganttFullHeight: number;
  ganttSVGRef: RefObject<SVGSVGElement>;
  ganttTaskContentRef: RefObject<HTMLDivElement>;
  onVerticalScrollbarScrollX: (event: SyntheticEvent<HTMLDivElement>) => void;
  ganttTaskRootRef: RefObject<HTMLDivElement>;
  onScrollGanttContentVertically: (
    event: SyntheticEvent<HTMLDivElement>
  ) => void;
  colors: Partial<ColorStyles>
  handleEditTask: (editableTaskInfo: EditableTaskInfo) => void;
  scrollToTask: (task: Task) => void;
  selectTask: (taskId: string) => void;
  ganttHeight: string;
};

const TaskGanttInner: React.FC<TaskGanttProps> = (props) => {
  const {
    barProps,
    barProps: { additionalLeftSpace },
    calendarProps,
    fullRowHeight,
    fullSvgWidth,
    ganttFullHeight,
    ganttSVGRef,
    gridProps,
    distances: { columnWidth, rowHeight, minimumRowDisplayed },
    ganttTaskContentRef,
    onVerticalScrollbarScrollX,
    ganttTaskRootRef,
    onScrollGanttContentVertically: onScrollVertically,
    colors,
    handleEditTask,
    scrollToTask,
    selectTask,
    ganttHeight,
  } = props;
  const containerStyle: CSSProperties = {
    // In order to see the vertical scrollbar of the gantt content,
    // we resize dynamically the width of the gantt content
    // height: Math.max(ganttFullHeight, minimumRowDisplayed * rowHeight),
    height: ganttHeight,
    // width: ganttTaskRootRef?.current
    //   ? ganttTaskRootRef.current.clientWidth +
    //     ganttTaskRootRef.current.scrollLeft
    //   : fullSvgWidth,
    width: fullSvgWidth,
  };

  const gridStyle = useMemo<CSSProperties>(
    () => ({
      height: Math.max(ganttFullHeight, minimumRowDisplayed * rowHeight),
      width: fullSvgWidth,
      backgroundSize: `${columnWidth}px ${fullRowHeight * 2}px`,
      backgroundPositionX: additionalLeftSpace || undefined,
      backgroundImage: [
        `linear-gradient(to right, #ebeff2 1px, transparent 2px)`,
        `linear-gradient(to bottom, transparent ${fullRowHeight}px, #f5f5f5 ${fullRowHeight}px)`,
      ].join(", "),
    }),
    [
      additionalLeftSpace,
      columnWidth,
      fullRowHeight,
      fullSvgWidth,
      ganttFullHeight,
    ]
  );

  const [arrowAnchorEl, setArrowAnchorEl] = React.useState<null | SVGElement>(
    null
  );
  const [selectedDependency, setSelectedDependency] = React.useState<{
    taskFrom: Task;
    extremityFrom: DateExtremity;
    taskTo: Task;
    extremityTo: DateExtremity;
  }>(null);
  const isArrowContextualPaletteOpened = Boolean(arrowAnchorEl);
  const onClickArrow: (
    taskFrom: Task,
    extremityFrom: DateExtremity,
    taskTo: Task,
    extremityTo: DateExtremity,
    event: React.MouseEvent<SVGElement>
  ) => void = (taskFrom, extremityFrom, taskTo, extremityTo, event) => {
    setArrowAnchorEl(event.currentTarget);
    setSelectedDependency({ taskFrom, extremityFrom, taskTo, extremityTo });
  };

  const [selectedCellPos, setSelectedCellPos] = React.useState<[number, number]>([0, 0]);

  const [taskItemPosMap, setTaskItemPosMap] = React.useState<TaskItemPosMap>({ left: new Set(), right: new Set() });

  const onCloseArrowContextualPalette = () => {
    setArrowAnchorEl(null);
  };

  let arrowContextualPalette:
    | React.FunctionComponentElement<TaskDependencyContextualPaletteProps>
    | undefined = undefined;
  if (barProps.TaskDependencyContextualPalette && selectedDependency) {
    arrowContextualPalette = React.createElement(
      barProps.TaskDependencyContextualPalette,
      {
        taskFrom: selectedDependency.taskFrom,
        extremityFrom: selectedDependency.extremityFrom,
        taskTo: selectedDependency.taskTo,
        extremityTo: selectedDependency.extremityTo,
        onClosePalette: onCloseArrowContextualPalette,
      }
    );
  } else {
    arrowContextualPalette = <div></div>;
  }

  const onArrowClickAway = (e: MouseEvent | TouchEvent) => {
    const svgElement = e.target as SVGElement;
    if (svgElement) {
      const keepPalette =
        svgElement.ownerSVGElement?.classList.contains("ArrowClassName");
      // In a better world the contextual palette should be defined in TaskItem component but ClickAwayListener and Popper uses div that are not displayed in svg
      // So in order to let the palette open when clicking on another task, this checks if the user clicked on another task
      if (!keepPalette) {
        setArrowAnchorEl(null);
        setSelectedDependency(null);
      }
    }
  };

  // Manage the contextual palette
  const [anchorEl, setAnchorEl] = React.useState<null | SVGElement>(null);
  const [selectedTask, setSelectedTask] = React.useState<Task>(null);
  const open = Boolean(anchorEl);
  const onClickTask: (
    task: Task,
    event: React.MouseEvent<SVGElement>
  ) => void = (task, event) => {
    setAnchorEl(event.currentTarget);
    setSelectedTask(task);
    barProps.onClick(task, event);
  };

  const onClose = () => {
    setAnchorEl(null);
  };

  let contextualPalette:
    | React.FunctionComponentElement<TaskContextualPaletteProps>
    | undefined = undefined;
  if (barProps.ContextualPalette && selectedTask) {
    contextualPalette = React.createElement(barProps.ContextualPalette, {
      selectedTask,
      onClosePalette: onClose,
    });
  } else {
    contextualPalette = <div></div>;
  }

  const onClickAway = (e: MouseEvent | TouchEvent) => {
    const svgElement = e.target as SVGElement;
    if (svgElement) {
      const keepPalette =
        svgElement.ownerSVGElement?.classList.contains("TaskItemClassName");
      // In a better world the contextual palette should be defined in TaskItem component but ClickAwayListener and Popper uses div that are not displayed in svg
      // So in order to let the palette open when clicking on another task, this checks if the user clicked on another task
      if (!keepPalette) {
        setAnchorEl(null);
        setSelectedTask(null);
      }
    }
  };

  const lastPosRef = React.useRef<[number, number]>([-999, -999]);
  const onMouseMove = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const xIndex = Math.floor(x / columnWidth);
    const yIndex = Math.floor(y / rowHeight);

    if (lastPosRef.current[0] === xIndex && lastPosRef.current[1] === yIndex) {
      return;
    }

    lastPosRef.current = [xIndex, yIndex];

    const { mapGlobalRowIndexToTask } = barProps;
    const task = mapGlobalRowIndexToTask.get(yIndex);
    if (task.type === 'empty') {
      setSelectedCellPos([xIndex, yIndex]);
    } else {
      setSelectedCellPos([-999, -999]);
    }
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const { intersectionRatio, isIntersecting, boundingClientRect, rootBounds, target } = entry;
      const taskId = (target as HTMLElement).dataset.taskId;

      if (!intersectionRatio && !isIntersecting) {
        // 只判断水平方向的位置
        if (boundingClientRect.x >= rootBounds.x + rootBounds.width) {
          updateTaskPos(taskId, 'right');
        } else if (boundingClientRect.x + boundingClientRect.width <= rootBounds.x) {
          updateTaskPos(taskId, 'left');
        }
      } else if (intersectionRatio) {
        updateTaskPos(taskId, 'middle');
      }
    })

    function updateTaskPos(taskId: string, pos: 'left' | 'right' | 'middle') {
      setTaskItemPosMap(prev => {
        const newLeft = new Set(prev.left)
        const newRight = new Set(prev.right)

        newLeft.delete(taskId)
        newRight.delete(taskId)

        if (pos === 'left') {
          newLeft.add(taskId)
        } else if (pos === 'right') {
          newRight.add(taskId)
        }

        return { left: newLeft, right: newRight }
      })
    }
  }, {
    root: ganttTaskRootRef.current,
    threshold: 0
  })

  return (
    <ScrollContext.Provider value={{ observer }}>
    <div
      className={[styles.ganttTaskRoot, 'gantt-task-root'].join(' ')}
      ref={ganttTaskRootRef}
      onScroll={onVerticalScrollbarScrollX}
      dir="ltr"
    >
      <Calendar {...calendarProps} colors={colors} />

      <div
        ref={ganttTaskContentRef}
        className={styles.ganttTaskContent}
        style={containerStyle}
        onScroll={onScrollVertically}
      >
        <div style={gridStyle}>
          <svg
            className="gantt-svg"
            xmlns="http://www.w3.org/2000/svg"
            width={fullSvgWidth}
            height={ganttFullHeight}
            fontFamily={barProps.fontFamily}
            ref={ganttSVGRef}
            style={{
              background: colors.oddTaskBackgroundColor
            }}
            onMouseMove={onMouseMove}
          >
            <Grid {...gridProps} />
            <TaskGanttContent
              {...barProps}
              onClick={onClickTask}
              onArrowClick={onClickArrow}
            />
            <HoverableCell
              x={selectedCellPos[0] * columnWidth}
              y={selectedCellPos[1] * rowHeight}
              width={columnWidth}
              height={rowHeight}
              selectedCellPos={selectedCellPos}
              gridProps={gridProps}
              barProps={barProps}
              onClick={(editableTaskInfo) => {
                handleEditTask(editableTaskInfo);
              }}
            />
          </svg>

          <QuickLocateBtns
            fullRowHeight={fullRowHeight}
            barProps={barProps}
            taskItemPosMap={taskItemPosMap}
            scrollToTask={scrollToTask}
            selectTask={selectTask}
            ganttFullHeight={ganttFullHeight}
            ganttTaskRootRef={ganttTaskRootRef}
          />
        </div>

        {barProps.ContextualPalette && open && (
          <ClickAwayListener onClickAway={onClickAway}>
            <Popper
              key={`contextual-palette`}
              open={open}
              anchorEl={anchorEl}
              disablePortal
              placement="top"
            >
              <Paper>{contextualPalette}</Paper>
            </Popper>
          </ClickAwayListener>
        )}
        {barProps.TaskDependencyContextualPalette &&
          isArrowContextualPaletteOpened && (
            <ClickAwayListener onClickAway={onArrowClickAway}>
              <Popper
                key={`dependency-contextual-palette`}
                open={isArrowContextualPaletteOpened}
                anchorEl={arrowAnchorEl}
                disablePortal
                placement="top"
              >
                <Paper>{arrowContextualPalette}</Paper>
              </Popper>
            </ClickAwayListener>
          )}
      </div>
    </div>
    </ScrollContext.Provider>
  );
};

export const TaskGantt = memo(TaskGanttInner);
