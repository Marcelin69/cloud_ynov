'use client';

import { creatJob, editJob } from "@/actions/jobs";
import { useActionState, useEffect } from "react";
const initialState = {
    message: null,
    error: null,
};



const CreatJob = ({ id }) => {
    const action = id ? editJob : creatJob;
    const [state, formAction, pending] = useActionState(action, initialState);

    // const handleSubmit = (e) => {
    //     e.preventDefault();
    //     // Handle form submission logic here
    //     let fileName = e.target.jobTitle.value;
    //     console.log("Job Title:", fileName);
    // };
    // useEffect(() => {
    //     if (state.message) {
    //         alert(state.message);
    //     }
    //     if (state.error) {
    //         alert(state.error);
    //     }
    // }, [state]);
    return (
        <div className="flex flex-col min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
            <h1 className="text-2xl font-bold mb-4">Create Job</h1>
            <form className="space-y-4" action={formAction}>
                <div className="flex flex-col">
                    <label className="block text-sm font-medium text-gray-700">Job Title</label>
                    <input
                        type="text"
                        name="jobTitle"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        placeholder="Enter job title"
                    />
                </div>
                <div>
                </div>
                <button
                    type="submit"
                    disabled={pending}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                >
                    {pending ? "Creating..." : "Create Job"}
                </button>
            </form>
        </div>
    );
}

export default CreatJob;