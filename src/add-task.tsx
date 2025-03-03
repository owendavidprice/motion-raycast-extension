import { Form, ActionPanel, Action, showToast, Toast } from "@raycast/api";
import { useState, useEffect } from "react";
import { getMotionApiClient, LABEL_PRESETS, Project } from "./api/motion";

type Values = {
  name: string;
  description: string;
  dueDate: Date;
  priority: "LOW" | "MEDIUM" | "HIGH" | "ASAP";
  status: "TODO" | "IN_PROGRESS" | "DONE";
  label: string;
  projectId: string;
};

// Define the task payload type to match what we're creating
type TaskPayload = {
  title: string;
  description: string;
  dueDate: Date;
  priority: "LOW" | "MEDIUM" | "HIGH" | "ASAP";
  status: "TODO" | "IN_PROGRESS" | "DONE";
  label?: string;
  projectId?: string;
};

// Helper function to get tomorrow's date
function getTomorrow() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0); // Set to midnight
  return tomorrow;
}

export default function Command() {
  const [isLoading, setIsLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);

  // Set default values
  const tomorrow = getTomorrow();

  // Fetch projects when component mounts
  useEffect(() => {
    async function fetchProjects() {
      try {
        const motionClient = getMotionApiClient();
        const projectsData = await motionClient.getProjects();
        setProjects(projectsData);
      } catch (error) {
        console.error("Error fetching projects:", error);
        await showToast({
          style: Toast.Style.Failure,
          title: "Failed to load projects",
          message: String(error),
        });
      } finally {
        setIsLoadingProjects(false);
      }
    }

    fetchProjects();
  }, []);

  async function handleSubmit(values: Values) {
    setIsLoading(true);

    try {
      const motionClient = getMotionApiClient();

      // Create a task payload with required fields
      const taskPayload: TaskPayload = {
        title: values.name,
        description: values.description,
        dueDate: values.dueDate,
        priority: values.priority,
        status: values.status,
      };

      // Only add label if it has a value
      if (values.label) {
        taskPayload.label = values.label;
      }

      // Only add projectId if it has a value
      if (values.projectId) {
        taskPayload.projectId = values.projectId;
      }

      // Create the task with the prepared payload
      await motionClient.createTask(taskPayload);

      await showToast({
        style: Toast.Style.Success,
        title: "Task created",
        message: `"${values.name}" has been added to Motion`,
      });
    } catch (error) {
      console.error("Error creating task:", error);

      await showToast({
        style: Toast.Style.Failure,
        title: "Failed to create task",
        message: String(error),
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form
      isLoading={isLoading || isLoadingProjects}
      actions={
        <ActionPanel>
          <Action.SubmitForm onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.Description text="Add a new task to your Motion account." />
      <Form.TextField id="name" title="Name" placeholder="Task name" />
      <Form.TextArea id="description" title="Description" placeholder="Task description" />

      <Form.DatePicker
        id="dueDate"
        title="Due Date"
        defaultValue={tomorrow}
        type={Form.DatePicker.Type.Date} // Only date, no time
      />

      <Form.Dropdown id="priority" title="Priority" defaultValue="MEDIUM">
        <Form.Dropdown.Item value="LOW" title="Low" />
        <Form.Dropdown.Item value="MEDIUM" title="Medium" />
        <Form.Dropdown.Item value="HIGH" title="High" />
        <Form.Dropdown.Item value="ASAP" title="ASAP" />
      </Form.Dropdown>

      <Form.Dropdown id="status" title="Status" defaultValue="TODO">
        <Form.Dropdown.Item value="TODO" title="To Do" />
        <Form.Dropdown.Item value="IN_PROGRESS" title="In Progress" />
        <Form.Dropdown.Item value="DONE" title="Done" />
      </Form.Dropdown>

      <Form.Dropdown id="label" title="Label">
        <Form.Dropdown.Item value="" title="None" />
        {LABEL_PRESETS.map((label) => (
          <Form.Dropdown.Item key={label} value={label} title={label} />
        ))}
      </Form.Dropdown>

      <Form.Dropdown id="projectId" title="Project">
        <Form.Dropdown.Item value="" title="None" />
        {projects.map((project: Project) => (
          <Form.Dropdown.Item key={project.id} value={project.id} title={project.name} />
        ))}
      </Form.Dropdown>
    </Form>
  );
}