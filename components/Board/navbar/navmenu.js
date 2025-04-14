import {
  Summarize,
  Alarm,
  FormatListBulleted,
  ViewKanban,
} from "../../../common/icons";
export const navItems = [
  {
    name: "Summary",
    icon: <Summarize className="h-4 w-4" />,
    path: "summary",
    className: "text-muted-foreground hover:text-foreground",
  },
  {
    name: "Timeline",
    icon: <Alarm className="h-4 w-4" />,
    path: "calendar",
    className: "text-muted-foreground hover:text-foreground",
  },
  {
    name: "Board",
    icon: <ViewKanban className="h-4 w-4" />,
    path: "board",
    className: "text-blue-600",
  },
  {
    name: "List",
    icon: <FormatListBulleted className="h-4 w-4" />,
    path: "list",
    className: "text-muted-foreground hover:text-foreground",
  },
];
