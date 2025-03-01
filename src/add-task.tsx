import { Form, ActionPanel, Action, showToast, Toast } from "@raycast/api";
import { useState } from "react";
import { getMotionApiClient, LABEL_PRESETS } from "./api/motion";

type Values = {
  name: string;
  description: string;
  dueDate: Date;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  status: "TODO" | "IN_PROGRESS" | "DONE";
  label: string;
};

// Helper function to get date 1 week from now
function getNextWeek() {
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  // Remove the time setting to default to midnight
  nextWeek.setHours(0, 0, 0, 0);
  return nextWeek;
}

// Helper function to get tomorrow's date
function getTomorrow() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0); // Set to midnight
  return tomorrow;
}

export default function Command() {
  const [isLoading, setIsLoading] = useState(false);
  
  // Set default values
  const tomorrow = getTomorrow();

  async function handleSubmit(values: Values) {
    setIsLoading(true);
    
    try {
      const motionClient = getMotionApiClient();
      
      // Convert form values to match the API client's expected format
      await motionClient.createTask({
        title: values.name,
        description: values.description,
        dueDate: values.dueDate,
        priority: values.priority,
        status: values.status,
        label: values.label
      });
      
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
      isLoading={isLoading}
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
        <Form.Dropdown.Item value="URGENT" title="Urgent" />
      </Form.Dropdown>
      
      <Form.Dropdown id="status" title="Status" defaultValue="TODO">
        <Form.Dropdown.Item value="TODO" title="To Do" />
        <Form.Dropdown.Item value="IN_PROGRESS" title="In Progress" />
        <Form.Dropdown.Item value="DONE" title="Done" />
      </Form.Dropdown>
      
      <Form.Dropdown id="label" title="Label">
        <Form.Dropdown.Item value="" title="None" />
        {LABEL_PRESETS.map(label => (
          <Form.Dropdown.Item key={label} value={label} title={label} />
        ))}
      </Form.Dropdown>
    </Form>
  );
}
