"use server";
export async function creatJob(state, formData) {


    const jobTitle = formData.get("jobTitle");

    if (!jobTitle) {
        return { message: null, error: "Job title is required" };
    }
console.log("start");

    const response = await fetch("https://apijob-fpe6hbe2h9c4agh2.francecentral-01.azurewebsites.net/jobs/", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ fileName: jobTitle }),
    });
    
    const data = await response.json();
    console.log("Data:", data);
    if (!data.OK) {
    return { message: `Job created successfully with title: ${jobTitle}`, error: null };
        
    }
    return { message: null, error: data.error || "Failed to create job" };
}

export async function editJob(state, formData) {
    // Simulate editing a job
    return { message: "Job edited successfully", error: null };
}
