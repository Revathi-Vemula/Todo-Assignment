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

const hasTodo = (requestQuery) => {
  return requestQuery.todo !== undefined;
};

const hasDueDate = (requestQuery) => {
  return requestQuery.dueDate !== undefined;
};

const isInValidStatus = (status) => {
  if (
    status === "TO DO" ||
    status === "IN PROGRESS" ||
    status === "DONE" ||
    status === undefined
  ) {
    return true;
  } else {
    return false;
  }
};

const isInValidPriority = (priority) => {
  if (
    priority === "HIGH" ||
    priority === "MEDIUM" ||
    priority === "LOW" ||
    priority === undefined
  ) {
    return true;
  } else {
    return false;
  }
};

const isInValidCategory = (category) => {
  if (
    category === "WORK" ||
    category === "HOME" ||
    category === "LEARNING" ||
    category === undefined
  ) {
    return true;
  } else {
    return false;
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

const isValidDate = (date) => {
  const parsedDate = parseJSON(new Date(date));
  if (isValid(parsedDate)) {
    const year = parsedDate.getFullYear();
    const day = parsedDate.getDate();
    const month = parsedDate.getMonth();
    newDate = format(new Date(year, month, day), "yyyy-MM-dd");
    return parseJSON(newDate);
  } else {
    return "Invalid Date";
  }
};
//API 1
app.get("/todos/", async (request, response) => {
  const { status, priority, category, search_q = "" } = request.query;
  let getTodosQuery = "";
  if (!isInValidStatus(status)) {
    response.status(400);
    response.send("Invalid Todo Status");
  } else if (!isInValidPriority(priority)) {
    response.status(400);
    response.send("Invalid Todo Priority");
  } else if (!isInValidCategory(category)) {
    response.status(400);
    response.send("Invalid Todo Category");
  } else {
    switch (true) {
      case hasPriorityAndStatus(request.query):
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
  const newDate = isValidDate(date);
  if (newDate !== "Invalid Date") {
    const getAllTodosWithDueDate = `
        SELECT 
            * 
        FROM 
            todo 
        WHERE 
            due_date = ${newDate};`;
    const allTodos = await db.all(getAllTodosWithDueDate);
    response.send(
      allTodos.map((eachTodo) => convertDBToResponseTodo(eachTodo))
    );
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

//API 4
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  if (!isInValidStatus(status)) {
    response.status(400);
    response.send("Invalid Todo Status");
  } else if (!isInValidPriority(priority)) {
    response.status(400);
    response.send("Invalid Todo Priority");
  } else if (!isInValidCategory(category)) {
    response.status(400);
    response.send("Invalid Todo Category");
  } else if (!isValid(parseJSON(new Date(dueDate)))) {
    response.status(400);
    response.send("Invalid Due Date");
  } else {
    const createNewTodo = `
        INSERT INTO 
        todo(id, todo, priority, status, category, due_date)
        VALUES(${id},'${todo}','${priority}','${status}','${category}','${dueDate}');`;

    await db.run(createNewTodo);
    response.send("Todo Successfully Added");
  }
});

//API 5
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let { status, category, todo, priority, dueDate } = request.body;
  let updateColumn = "";
  switch (true) {
    case hasStatus(request.body):
      updateColumn = "Status";
      if (!isInValidStatus(status)) {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    case hasPriority(request.body):
      updateColumn = "Priority";
      if (!isInValidPriority(priority)) {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    case hasCategory(request.body):
      updateColumn = "Category";
      if (!isInValidCategory(category)) {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    case hasTodo(request.body):
      updateColumn = "Todo";
      break;
    case hasDueDate(request.body):
      updateColumn = "Due Date";
      if (isValid(dueDate)) {
        response.status(400);
        response.send("Invalid Due Date");
      }
      break;
  }
  const prevTodoQuery = `SELECT * FROM todo WHERE id = ${todoId};`;
  const prevTodo = await db.get(prevTodoQuery);

  const {
    status1 = prevTodo.status,
    category1 = prevTodo.category,
    todo1 = prevTodo.todo,
    priority1 = prevTodo.priority,
    dueDate1 = prevTodo.due_date,
  } = request.body;

  const updateTodoQuery = `
    UPDATE 
        todo 
    SET 
        status = '${status1}',
        category = '${category1}',
        todo = '${todo1}',
        priority = '${priority1}',
        due_date = '${dueDate1}'
    WHERE 
        id = ${todoId};`;

  await db.run(updateTodoQuery);
  response.send(`${updateColumn} Updated`);
});

//API 6
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
    DELETE FROM 
        todo 
    WHERE 
        id = ${todoId};`;
  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
