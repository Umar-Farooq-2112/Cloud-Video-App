const BASE_URL = "http://localhost:4502";

// const userId = 1; // Example user ID
// Retrieve the user ID from the URL query parameters

const params = new URLSearchParams(window.location.search);
const userId = params.get("id");
// const userId = 1;

// Use the user ID in your application
if (userId) {
  console.log(`User ID: ${userId}`);
  const messageElement = document.getElementById("message");
  if (messageElement) {
    // messageElement.innerText = `Welcome, User ID: ${userId}`;
  }
} else {
  console.log("No user ID provided.");
}

// Fetch user info and videos on load
document.addEventListener("DOMContentLoaded", async () => {
  await loadUserInfo();
  await loadVideos();
});

// Load user info

// Load user info
async function loadUserInfo() {
  try {
    // Fetch user info from the backend
    const response = await fetch(`${BASE_URL}/userinfo/${userId}`,);
    const data = await response.json();
    if (data.status === "Failed") {
      throw new Error(data.error);
      storageUsed = 0;
    }
    else {
      var storageUsed = data.storage_used
    }
    const storageLimit = 50; // Assuming 50 MB is the storage limit

    const storagePercentage = (storageUsed / storageLimit) * 100;

    // Update storage used text and progress bar value
    const storageUsedElement = document.getElementById("storage-used");
    const storageProgressElement = document.getElementById("storage-progress");

    storageUsedElement.textContent = `${parseFloat(storageUsed).toFixed(2)} MB of ${storageLimit} MB used`;
    storageProgressElement.value = storageUsed;

    // Alert users if storage is critical
    // Update progress bar color and alert users if necessary
    if (storagePercentage >= 80) {
      storageProgressElement.style.setProperty("--progress-bar-color", "red");
      if (storagePercentage === 100) {
        alert("Storage is 100% utilized. Please delete some videos to upload new ones.");
      } else {
        alert("Warning: 80% of storage is utilized.");
      }
    } else {
      storageProgressElement.style.setProperty("--progress-bar-color", "#4CAF50");
    }


    // Save the updated storage used to the database
    // await updateStorage(userId, storageUsed);
  } catch (error) {
    console.error("Failed to load user info:", error);
  }
}

// Load uploaded videos with URLs
async function loadVideos() {
  try {
    const response = await fetch(`${BASE_URL}/fetch-videos/${userId}`);
    const data = await response.json();
    if (data.error) {throw new Error(data.error)};

    const videoList = document.getElementById("video-list");
    videoList.innerHTML = "";

    data.videos.forEach((video) => {
      const videoCard = document.createElement("div");
      videoCard.className = "video-card";

      if (video.error) {
        videoCard.innerHTML = `<p>${video.name} - ${video.error}</p>`;
      } else {
        videoCard.innerHTML = `
                    <video controls>
                        <source src="${video.url}" type="video/mp4">
                        Your browser does not support the video tag.
                    </video>
                    <p>${video.name} (${parseFloat(video.size).toFixed(2)} MB)</p>
                `;
        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "Delete";
        deleteBtn.addEventListener("click", () => deleteVideo(video.name));
        videoCard.appendChild(deleteBtn);
      }

      videoList.appendChild(videoCard);
    });

    // Recalculate and update storage bar after loading videos
    await loadUserInfo();
  } catch (error) {
    console.error("Failed to load videos:", error);
  }
}

// Upload video

// Upload video
document.getElementById("uploadForm").addEventListener("submit", async (e) => {
  e.preventDefault(); // Prevent form submission refresh

  const videoName = document.getElementById("vname").value;
  const videoFile = document.getElementById("videoFile").files[0];

  if (!videoFile) {
    alert("Please select a video file to upload.");
    return;
  }

  // Calculate file size in MB
  const fileSizeInMB = (videoFile.size / (1024 * 1024)).toFixed(2);

  try {
    // Fetch current storage used from the database
    const userInfoResponse = await fetch(`${BASE_URL}/userinfo/${userId}`);
    const userInfo = await userInfoResponse.json();

    if (userInfo.status === "Failed") {
      throw new Error(userInfo.error);
    }

    const currentStorage = parseFloat(userInfo.storage_used || 0);
    const maxStorage = 50; // Storage limit in MB

    // Check if storage will exceed limit
    if (currentStorage + parseFloat(fileSizeInMB) > maxStorage) {
      alert(
        "Not enough storage to upload this video. Please delete some videos."
      );
      return;
    }

    // Prepare form data for upload
    const formData = new FormData();
    formData.append("video", videoFile); // Add the video file
    formData.append("user_id", userId); // Add the user ID
    formData.append("vname", videoName); // Add the video name
    formData.append("bandwidth", parseFloat(fileSizeInMB)); // Add updated storage

    // Send POST request to upload video
    const response = await fetch(`${BASE_URL}/video`, {
      method: "POST",
      body: formData,
    });

    const result = await response.json();

    if (response.ok) {
      document.getElementById("message").innerText =
        "Upload successful! Video URL: " + result.videoUrl;

      // Reload user info and videos
      await loadUserInfo();
      await loadVideos();


    } else {
      document.getElementById("message").innerText =
        "Error: " + (result.error || "Upload failed.");
    }
  } catch (error) {
    console.error("Error during upload:", error);
    document.getElementById("message").innerText =
      "Upload failed. Please try again.";
  }
});



// async function updateStorage(userId, storageUsed) {
//   try {
//     const response = await fetch('http://localhost:3000/update-storage', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({ userId, storageUsed }),
//     });

//     const result = await response.json();
//     if (result.success) {
//       console.log('Storage updated successfully.');
//     } else {
//       console.error('Error:', result.error);
//     }
//   } catch (error) {
//     console.error('Error:', error);
//   }
// }

// Delete video
async function deleteVideo(videoName) {
  console.log(videoName);
  try {
    const currentStorage = parseInt(
      document.getElementById("storage-used").textContent,
      10
    );
    const response1 = await fetch(`${BASE_URL}/videosize`, {
      method: "POST",
      headers: {
          "Content-Type": "application/json",
      },
      body: JSON.stringify({
          vname: `${userId}/${videoName}`, // Make sure videoName is set correctly
      }),
  });

    const data1 = await response1.json();

    if (data1.status == "OK"){
      console.log("MBS FETCHED SUCCESSFULLY");
    }else{
      console.log("Eroro fetching size");
      return;
    }
    // Corrected variable name: Use 'vsize' instead of 'strg'
    const vsize = data1.vsize;

    console.log("Vsize: " + vsize); // Log the correct variable
    
    // storageUsed = storageUsed - vsize; // Example size reduction for the video
    // console.log("storageUsed: " + storageUsed); // Log the correct variable
    
    const response = await fetch(`${BASE_URL}/video`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: userId,
        vname: videoName,
        storage: parseFloat(vsize).toFixed(1),
      }),
    });
    const data = await response.json();

    if (data.status === "Failed") throw new Error(data.error);

    await loadUserInfo();
    await loadVideos();
  } catch (error) {
    console.error("Failed to delete video:", error);
  }
}

// Logout button functionality
document.getElementById("logout-btn").addEventListener("click", () => {
  window.location.href = "http://localhost:3000/"; // Update the path based on your folder structure
});
