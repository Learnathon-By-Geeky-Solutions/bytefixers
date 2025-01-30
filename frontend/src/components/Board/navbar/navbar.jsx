import {
  Notifications,
  Help,
  AccountCircle,
  Add,
  Share,
  Search,
  Input,
  Button,
  Summarize,
  Alarm,
  FormatListBulleted,
  ViewKanban,
  Link,
} from "../../../common/icons";

const TopNavbar = () => {
  return (
    <div className="flex flex-col border-b">
      {/* Main Navbar */}
      <div className="flex h-14 items-center px-4 gap-60 border-b">
        <div className="flex items-center gap-2 flex-1">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search"
            className="h-9 md:w-[300px] lg:w-[400px] border-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="contained"
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Add className="h-4 w-4 mr-1" />
            Create
          </Button>
          <Button variant="ghost" size="icon">
            <Notifications className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <Help className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <AccountCircle className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Project Header */}
      <div className="flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold">Project Management</h1>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">
              <Share className="h-4 w-4 mr-1" />
              Share
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation Items */}
      <div className="flex items-center px-4 h-10 gap-6 text-sm">
        <Link
          href="#"
          style={{ textDecoration: "none" }}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground "
        >
          <Summarize className="h-4 w-4" />
          Summary
        </Link>
        <Link
          href="#"
          style={{ textDecoration: "none" }}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <Alarm className="h-4 w-4" />
          Timeline
        </Link>
        <Link
          href="#"
          style={{ textDecoration: "none" }}
          className="flex items-center gap-2 text-blue-600"
        >
          <ViewKanban className="h-4 w-4" />
          Board
        </Link>
        <Link
          href="#"
          style={{ textDecoration: "none" }}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <FormatListBulleted className="h-4 w-4" />
          List
        </Link>
        {/* <Link
          href="#"
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
        > */}
        {/* <FileText className="h-4 w-4" />
          Forms
        </Link>
        <Link
          href="#"
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <Code2 className="h-4 w-4" />
          Code
        </Link>
        <Link
          href="#"
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <File className="h-4 w-4" />
          Pages
        </Link>
        <Link
          href="#"
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <Shortcut className="h-4 w-4" />
          Shortcuts
        </Link> */}
        <Button variant="ghost" size="icon" className="ml-auto">
          <Add className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default TopNavbar;
