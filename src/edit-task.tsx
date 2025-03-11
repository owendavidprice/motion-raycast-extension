import { useState, useEffect } from "react";
import {
  Form,
  ActionPanel,
  Action,
  showToast,
  Toast,
  Icon,
  useNavigation,
  getPreferenceValues,
} from "@raycast/api";
import { getMotionApiClient, Project } from "./api/motion";

// Define task types
interface Task {
  id?: string;
  name: string;
  description?: string;
  dueDate?: string;
  priority?: "LOW" | "MEDIUM" | "HIGH" | "ASAP";
  status?: "TODO" | "IN_PROGRESS" | "DONE";
  label?: string;
  projectId?: string;
  workspaceId?: string;
  duration?: number | "NONE" | "REMINDER";
}

// Define the Motion task interface to match the API client
interface MotionTask {
  id?: string;
  name: string;
  description?: string;
  dueDate?: string;
  priority?: "LOW" | "MEDIUM" | "HIGH" | "ASAP";
  workspaceId: string;
  status?: "TODO" | "IN_PROGRESS" | "DONE";
  label?: string;
  projectId?: string;
  duration?: number | "NONE" | "REMINDER";
}

interface EditTaskProps {
  task: Task;
  onTaskUpdated: () => void;
}

export default function EditTask({ task, onTaskUpdated }: EditTaskProps) {
  const { pop } = useNavigation();
  const [isLoading, setIsLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [labels, setLabels] = useState<string[]>([]);

  // Load projects when the component mounts
  useEffect(() => {
    loadProjects();
    loadLabels();
  }, []);

  async function loadProjects() {
    try {
      const motionClient = getMotionApiClient();
      const projectsData = await motionClient.getProjects();
      setProjects(projectsData);
    } catch (error) {
      console.error("Error loading projects:", error);
      await showToast({
        style: Toast.Style.Failure,
        title: "Failed to load projects",
        message: String(error),
      });
    }
  }

  async function loadLabels() {
    try {
      const motionClient = getMotionApiClient();
      const workspaces = await motionClient.getWorkspaces();
      const workspace = workspaces.workspaces.find(
        (w) => w.id === getPreferenceValues<{ workspaceId: string }>().workspaceId
      );
      
      if (workspace && workspace.labels) {
        setLabels(workspace.labels);
      }
    } catch (error) {
      console.error("Error loading labels:", error);
      // Fallback to empty labels array
      setLabels([]);
    }
  }

  async function handleSubmit(values: Task) {
    setIsLoading(true);

    try {
      const motionClient = getMotionApiClient();
      const workspaceId = motionClient.getWorkspaceId();
      
      // Prepare the task object for update
      const updatedTask: MotionTask = {
        ...task,
        name: values.name,
        description: values.description || "",
        dueDate: values.dueDate,
        priority: values.priority,
        status: values.status,
        label: values.label,
        projectId: values.projectId,
        workspaceId: workspaceId, // Ensure workspaceId is always set
      };

      await motionClient.updateTask(updatedTask);
      
      await showToast({
        style: Toast.Style.Success,
        title: "Task updated",
      });
      
      // Notify parent component that task was updated
      onTaskUpdated();
      
      // Navigate back to the task list
      pop();
    } catch (error) {
      console.error("Error updating task:", error);
      await showToast({
        style: Toast.Style.Failure,
        title: "Failed to update task",
        message: String(error),
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form
      isLoading={isLoading}
      actions={
        <ActionPanel>
          <Action.SubmitForm onSubmit={handleSubmit} icon={Icon.Check} title="Update Task" />
          <Action title="Cancel" icon={Icon.XmarkCircle} onAction={pop} />
        </ActionPanel>
      }
    >
      <Form.TextField
        id="name"
        title="Task Name"
        placeholder="Enter task name"
        defaultValue={task.name}
        autoFocus
      />
      
      <Form.TextArea
        id="description"
        title="Description"
        placeholder="Enter task description"
        defaultValue={task.description}
      />
      
      <Form.DatePicker
        id="dueDate"
        title="Due Date"
        defaultValue={task.dueDate ? new Date(task.dueDate) : undefined}
      />
      
      <Form.Dropdown id="priority" title="Priority" defaultValue={task.priority || ""}>
        <Form.Dropdown.Item value="" title="No Priority" />
        <Form.Dropdown.Item value="LOW" title="Low" />
        <Form.Dropdown.Item value="MEDIUM" title="Medium" />
        <Form.Dropdown.Item value="HIGH" title="High" />
        <Form.Dropdown.Item value="ASAP" title="ASAP" />
      </Form.Dropdown>
      
      <Form.Dropdown id="status" title="Status" defaultValue={task.status || ""}>
        <Form.Dropdown.Item value="" title="No Status" />
        <Form.Dropdown.Item value="TODO" title="To Do" />
        <Form.Dropdown.Item value="IN_PROGRESS" title="In Progress" />
        <Form.Dropdown.Item value="DONE" title="Done" />
      </Form.Dropdown>
      
      <Form.Dropdown id="label" title="Label" defaultValue={task.label || ""}>
        <Form.Dropdown.Item value="" title="No Label" />
        {labels.map((label) => (
          <Form.Dropdown.Item key={label} value={label} title={label} />
        ))}
      </Form.Dropdown>
      
      <Form.Dropdown id="projectId" title="Project" defaultValue={task.projectId || ""}>
        <Form.Dropdown.Item value="" title="No Project" />
        {projects.map((project) => (
          <Form.Dropdown.Item key={project.id} value={project.id} title={project.name} />
        ))}
      </Form.Dropdown>
    </Form>
  );
}
