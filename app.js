import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.2/firebase-app.js'
import {
    getFirestore,
    onSnapshot,
    collection,
    addDoc,
    doc,
    setDoc,
    updateDoc,
    query,
    getDoc,
    where,
    deleteDoc,
    getDocs,
    orderBy,

} from 'https://www.gstatic.com/firebasejs/10.7.2/firebase-firestore.js'

const firebaseConfig = {
    apiKey: "AIzaSyCHm3noMZsrwABtHcMkjj9cxb7kAnDFTDw",
    authDomain: "my-todo-app-8b5e1.firebaseapp.com",
    projectId: "my-todo-app-8b5e1",
    storageBucket: "my-todo-app-8b5e1.appspot.com",
    messagingSenderId: "1082137768454",
    appId: "1:1082137768454:web:cc709457c7a06d647bc987",
    measurementId: "G-7B0PKVN3ZD"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let addBtn = document.getElementById("addBtn");
let saveBtn = document.getElementById("saveBtn");
let todoList = document.getElementById("todoList");
let todoInput = document.getElementById("todoInput");
let deleteAllBtn = document.getElementById("deleteAllBtn");
let editedLI = null;

const users = [];

saveBtn.style.display = "none";
deleteAllBtn.style.display = "none";

addBtn.addEventListener("click", addTodo);
deleteAllBtn.addEventListener("click", deleteAll);

                        // ADD TODO

const addDataFirebase = async (inputVal) => {
    const timestamp = new Date().getTime();
    const payload = {
        id: timestamp,
        todo: inputVal,
    };

    try {
        const docRef = await addDoc(collection(db, "users"), payload);
        console.log("Document written with ID: ", docRef.id);
    } catch (e) {
        console.error("Error adding document: ", e);
    }
}
function addTodo() {
    function generateUniqueId() {}

    let todoInput = document.getElementById("todoInput");
    let todoInputValue = todoInput.value;

    if (todoInputValue.trim()) {
        //   Creating LI tag
        let createLi = document.createElement("li");
        createLi.innerText = todoInputValue;

        // Generate a unique ID for the todo item
        const todoId = generateUniqueId();

        // Set data-id attribute with the todoId to the parent LI element
        createLi.setAttribute("data-id", todoId);

        //   Edit Button add in LI
        let editBtn = document.createElement("button");
        editBtn.innerText = "Edit";
        createLi.appendChild(editBtn);
        editBtn.setAttribute("class", "btn");

        //   Delete Button add in LI
        let deleteBtn = document.createElement("button");
        deleteBtn.innerText = "Delete";
        createLi.appendChild(deleteBtn);
        deleteBtn.setAttribute("class", "btn1");

        //   append LI in OL list
        todoList.appendChild(createLi);
        deleteAllBtn.style.display = "inline-block"
         
        addDataFirebase(todoInputValue);
    } else {
        alert("Please input text");
    }

    todoInput.value = "";
}

                          // READ TODO

const readData = async () => {
    let toDoItem = "";
    const q = query(collection(db, "users"), orderBy("id", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        querySnapshot.forEach((doc) => {
            users.push({
                id: doc.id,
                data: doc.data(),
            });
        });
        console.log(users);
        toDoItem = users.map(
            (todoObj) =>
                `<li class="button btn" data-id="${todoObj.id}">${todoObj.data.todo}
          <button class="button btn">Edit</button><button class="button btn1">Delete</button></li>`
        )
            .join("");

        todoList.innerHTML = toDoItem;
        users.length = 0;
                               
                                // EDITED TODO

        document.querySelectorAll(".btn").forEach((editBtn) => {
            editBtn.addEventListener("click", async (event) => {
                // Get the parent <li> element of the clicked edit button
                const parentLi = event.target.closest("li");

                if (parentLi) {
                    // Get the id of the todo item from the data-id attribute
                    const todoId = parentLi.getAttribute("data-id");

                    // Find the selected todo from the users array based on todoId
                    let selectedTodo = users.find((todo) => todo.id === todoId);

                    if (!selectedTodo) {
                        try {
                            // Retrieve the todo directly from Firestore
                            const docSnapshot = await getDoc(doc(db, "users", todoId));
                            const docData = docSnapshot.data();

                            // Create a new selectedTodo object with the retrieved data
                            selectedTodo = {
                                id: docSnapshot.id,
                                data: docData
                            };

                        } catch (error) { }
                    }

                    if (selectedTodo) {
                        // Set the input field with the selected todo data
                        todoInput.value = selectedTodo.data.todo;

                        // Show the save button and hide the add button
                        saveBtn.style.display = "inline-block";
                        addBtn.style.display = "none";

                        // Store the <li> element of the selected todo for updating later
                        editedLI = parentLi;
                    } else {
                        console.error("Todo not found!");
                    }
                } else {
                    console.error("Parent <li> element not found!");
                }
            });
        });
                             
                             //   DELETE TODO

        document.querySelectorAll(".btn1").forEach((deleteBtn) => {
            deleteBtn.addEventListener("click", async () => {
                const todoId = deleteBtn.parentElement.getAttribute("data-id");

                try {
                    // Delete the document from Firestore
                    await deleteDoc(doc(db, "users", todoId));
                    console.log("Document successfully deleted!");

                    // Remove the todo item from the users array
                    const index = users.findIndex(todo => todo.id === todoId);
                    if (index !== -1) {
                        users.splice(index, 1);
                    }
                } catch (e) {}
            });
        });
    });
};
readData();

                            //   SAVE EDIT TODO

saveBtn.addEventListener("click", async () => {
    // Get the id of the edited todo item
    const todoId = editedLI.getAttribute("data-id");

    // Get the updated todo text from the input field
    const updatedTodo = todoInput.value.trim();

    if (todoId && updatedTodo) {
        try {
            // Update the document in Firestore
            await updateDoc(doc(db, "users", todoId), {
                todo: updatedTodo
            });
            console.log("Document successfully updated in Firestore!");

            // Update the todo in the UI
            editedLI.innerText = updatedTodo;
        } catch (error) {}
    } 
    // Reset input field and buttons
    todoInput.value = "";
    saveBtn.style.display = "none";
    addBtn.style.display = "inline-block";
});

                      //   DELETE ALL TODO

async function deleteAll() {
    if (todoList.children.length > 0) {
        if (confirm("Do you want to delete all TODOS?")) {
            try {
                const querySnapshot = await getDocs(collection(db, "users"));
                querySnapshot.forEach(async (doc) => {
                    await deleteDoc(doc.ref);
                });
                console.log("All documents deleted successfully from Firestore!");
            } catch (error) {}

            // Clear UI
            todoList.innerHTML = "";
            todoInput.value = "";
        }
    }
    deleteAllBtn.style.display = "none";
}

