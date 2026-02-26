"use server";
export async function creatJob(state, formData) {


    const jobTitle = formData.get("jobTitle");

    if (!jobTitle) {
        return { message: null, error: "Job title is required" };
    }

    const response = await fetch(" http://127.0.0.1:8000/jobs", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ fileName: jobTitle }),
    });
    
    const data = await response.json();
    console.log("Data:", data);


    return { message: `Job created successfully with title: ${jobTitle}`, error: null };
}

export async function editJob(state, formData) {
    // Simulate editing a job
    return { message: "Job edited successfully", error: null };
}
