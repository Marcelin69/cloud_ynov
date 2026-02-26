"use server";
export async function creatJob(state, formData) {


    const jobTitle = formData.get("jobTitle");

    if (!jobTitle) {
        return { message: null, error: "Job title is required" };
    }

    const response = await fetch("https://api-dev-mt-ardceph4g4d5fsgm.francecentral-01.azurewebsites.net/jobs", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ fileName: jobTitle, contentType: "text/plain"  }),
    });

    console.log("Response:", response);


    return { message: `Job created successfully with title: ${jobTitle}`, error: null };
}

export async function editJob(state, formData) {
    // Simulate editing a job
    return { message: "Job edited successfully", error: null };
}
