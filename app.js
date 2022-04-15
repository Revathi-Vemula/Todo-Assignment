const express = require("express");
const app = express();
app.use(express.json());

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const isValid = require("date-fns/isValid");
const format = require("date-fns/format");
var parseJSON = require("date-fns/parseJSON");
const dbPath = path.join(__dirname, "todoApplication.db");
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("The Server is running at http://localhost:3000....")
    );
  } catch (error) {
    console.log(`DB Error:${error.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const hasPriorityAndStatus = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasCategoryAndStatus = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};

const hasCategoryAndPriority = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};

const hasStatus = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const hasPriority = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasCategory = (requestQuery) => {
  return requestQuery.category !== undefined;
};

const isValidStatus = (status) => {
  if (status !== "TO DO" || status !== "IN PROGRESS" || status !== "DONE") {
    return true;
  }
};

const isValidPriority = (priority) => {
  if (priority !== "HIGH" || priority !== "MEDIUM" || priority !== "LOW") {
    return true;
  }
};

const isValidCategory = (category) => {
  if (category !== "WORK" || category !== "HOME" || category !== "LEARNING") {
    return true;
  }
};

const convertDBToResponseTodo = (dbObject) => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    priority: dbObject.priority,
    status: dbObject.status,
    category: dbObject.category,
    dueDate: dbObject.due_date,
  };
};

//API 1
app.get("/todos/", async (request, response) => {
  const { status, priority, category, search_q = "" } = request.query;
  let getTodosQuery = "";
  switch (true) {
    case hasPriorityAndStatus(request.query):
      if (isValidStatus(status)) {
        response.send("Invalid Todo Status");
        response.status(400);
      }
      if (isValidPriority(priority)) {
        response.send("Invalid Todo Priority");
        response.status(400);
      }
      getTodosQuery = `
            SELECT 
                * 
            FROM 
                todo 
            WHERE 
                todo LIKE '%${search_q}%'
            AND 
                priority = '${priority}'
            AND 
                status = '${status}';`;
      break;
    case hasCategoryAndStatus(request.query):
      if (isValidStatus(status)) {
        response.send("Invalid Todo Status");
        response.status(400);
      }
      if (isValidCategory(category)) {
        response.send("Invalid Todo Category");
        response.status(400);
      }
      getTodosQuery = `
            SELECT 
                * 
            FROM 
                todo 
            WHERE 
                todo LIKE '%${search_q}%'
            AND 
                category = '${category}'
            AND 
                status = '${status}';`;
      break;
    case hasCategoryAndPriority(request.query):
      if (isValidCategory(category)) {
        response.send("Invalid Todo Category");
        response.status(400);
      }
      if (isValidPriority(priority)) {
        response.send("Invalid Todo Priority");
        response.status(400);
      }
      getTodosQuery = `
            SELECT 
                * 
            FROM 
                todo 
            WHERE 
                todo LIKE '%${search_q}%'
            AND 
                category = '${category}'
            AND 
                priority = '${priority}';`;
      break;
    case hasStatus(request.query):
      if (isValidStatus(status)) {
        response.send("Invalid Todo Status");
        response.status(400);
      }
      getTodosQuery = `
            SELECT 
                * 
            FROM 
                todo 
            WHERE 
                todo LIKE '%${search_q}%'
            AND 
                status = '${status}';`;
      break;
    case hasPriority(request.query):
      if (isValidPriority(priority)) {
        response.send("Invalid Todo Priority");
        response.status(400);
      }
      getTodosQuery = `
            SELECT 
                * 
            FROM 
                todo 
            WHERE 
                todo LIKE '%${search_q}%'
            AND 
                priority = '${priority}';`;
      break;
    case hasCategory(request.query):
      if (isValidCategory(category)) {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      getTodosQuery = `
            SELECT 
                * 
            FROM 
                todo 
            WHERE 
                todo LIKE '%${search_q}%'
            AND 
                category = '${category}';`;
      break;
    default:
      getTodosQuery = `
            SELECT 
                * 
            FROM 
                todo 
            WHERE 
                todo LIKE '%${search_q}%';`;
      break;
  }

  const todoData = await db.all(getTodosQuery);
  response.send(todoData.map((eachTodo) => convertDBToResponseTodo(eachTodo)));
});

//API 2
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `
    SELECT * FROM todo WHERE id = ${todoId};`;
  const todoData = await db.get(getTodoQuery);
  response.send(convertDBToResponseTodo(todoData));
});

//API 3 getting error
app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  console.log(date);
  const parsedDate = parseJSON(date);
  console.log(`${parsedDate} //Parsed Date`);
  console.log(`${isValid(parsedDate)} //is Valid date or not`);
  if (isValid(parsedDate)) {
    const year = parsedDate.getFullYear();
    const day = parsedDate.getDate();
    const month = parsedDate.getMonth();
    const newDate = format(new Date(year, month + 1, day), "yyyy-MM-dd");
    console.log(`${newDate} //Formatted Date`);
  } else {
    console.log("Invalid Date");
  }
});

//API 4
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  const createNewTodo = `
    INSERT INTO 
    todo(id, todo, priority, status, category, due_date)
    VALUES(${id},'${todo}','${priority}','${status}','${category}','${dueDate}');`;

  await db.run(createNewTodo);
  response.send("Todo Successfully Added");
});
