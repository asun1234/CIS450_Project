process.env.UV_THREADPOOL_SIZE = 100

var config = require('./db-config.js');
const secondsToWait = 65000;
config.connectionLimit = 100;
var poolPromise = config;
function queryDB(res, query, input) {
  poolPromise
    .then(pool => {
      pool.getConnection()
        .then(connection => {
          connection.execute(query, function (err, rows, fields) {
            if (err) {
              console.log(err);
            } else {
              res.json(rows);
            }
          });
        });
    })
    .then(() => {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          resolve();
          console.log('Done waiting, proceeding to use the connection');
        }, secondsToWait * 1000);
      });
    })
    .catch(err => {
      throw new Error('Error initializing db connection: ', err);
    });
}

function getTopTen(req, res) {
  var query = `
      SELECT *
      FROM (SELECT id, recipetitle FROM recipes ORDER BY rating DESC)
      WHERE rownum <= 10
      `;
  queryDB(res, query, '')
};

function getCategories(req, res) {
  var query = `
  WITH top_20_categories AS (
    SELECT category
    FROM (SELECT category, COUNT(recipeid) AS count
        FROM recipe_categories
        GROUP BY category
        ORDER BY count DESC)
    WHERE rownum <= 20
),
     avg_ratings AS (
         SELECT recipeid, category
         FROM recipe_categories
         WHERE category IN (SELECT category FROM top_20_categories)
     )
     SELECT INITCAP(category) as Category, ROUND(AVG(rating), 2) AS AverageRating
     FROM avg_ratings JOIN recipes ON recipeId = id
     GROUP BY category
     ORDER BY AVG(rating) DESC
  `;
  queryDB(res, query, '')
};

function getSearch(req, res) {
  var input = req.params.byTitle;
  var query = `
SELECT *
FROM (SELECT * FROM recipes WHERE LOWER(recipetitle) LIKE '%${input}%')
WHERE rownum <= 50
ORDER BY rating DESC
`;
  queryDB(res, query, input)
};

function getSearchIngredient(req, res) {
  var input = req.params.byIngredient;
  var query = `
  SELECT *
  FROM recipes
  WHERE id IN (SELECT recipeid FROM (SELECT recipeid
  FROM recipe_ingredients
  WHERE LOWER(ingredient) LIKE '%${input}%'))
  AND rownum <= 50
  ORDER BY rating DESC
`;
  queryDB(res, query, input)
};

function getLowCal(req, res) {
  var query = `
  WITH low_cal_recipes AS
  (SELECT recipeid, calories FROM nutrition_data
    WHERE calories < 300),
    ans as (SELECT recipeid, recipetitle, calories, r.rating
    FROM low_cal_recipes c JOIN recipes r ON recipeid = id
    ORDER BY calories ASC, r.rating DESC)
    SELECT * FROM ans WHERE rownum <= 30
    `;
  queryDB(res, query, '')
};

function getHighProtein(req, res) {
  var query = `
  WITH low_cal_recipes AS
  (SELECT recipeid, protein FROM nutrition_data
    WHERE protein > 15),
    ans as (SELECT recipeid, recipetitle, protein, r.rating
    FROM low_cal_recipes c JOIN recipes r ON recipeid = id
    ORDER BY protein DESC, r.rating DESC)
    SELECT * FROM ans WHERE rownum <= 30
    `;
  queryDB(res, query, '')
};

function getIngredientsByRecipe(req, res) {
  var input = req.params.recipeTitle;
  var query = `
  SELECT DISTINCT ingredient
  FROM recipe_ingredients r
  WHERE r.recipeId IN
  (SELECT id
    FROM recipes
    WHERE recipetitle LIKE '%${input}')
    ORDER BY ingredient ASC
  `;
  queryDB(res, query, input)
};

function getLowFat(req, res) {
  var query = `
  WITH low_cal_recipes AS 
  (SELECT recipeid, totalfat FROM nutrition_data 
    WHERE totalfat < 10),
    ans as (SELECT recipeid, recipetitle, totalfat, r.rating
    FROM low_cal_recipes c JOIN recipes r ON recipeid = id
    ORDER BY totalfat ASC, r.rating DESC)
    SELECT * FROM ans WHERE rownum <= 30
    `;
  queryDB(res, query, '')
};

function getLowCarb(req, res) {
  var query = `
  WITH low_cal_recipes AS
  (SELECT recipeid, carbohydrates FROM nutrition_data
    WHERE carbohydrates < 10),
    ans as (SELECT recipeid, recipetitle, carbohydrates, r.rating
    FROM low_cal_recipes c JOIN recipes r ON recipeid = id
    ORDER BY carbohydrates ASC, r.rating DESC)
    SELECT * FROM ans WHERE rownum <= 30
    `;
  queryDB(res, query, '')
};

function getLowSugar(req, res) {
  var query = `
  WITH low_cal_recipes AS
  (SELECT recipeid, sugar FROM nutrition_data
    WHERE sugar < 10),
    ans as (SELECT recipeid, recipetitle, sugar, r.rating
    FROM low_cal_recipes c JOIN recipes r ON recipeid = id
    ORDER BY sugar ASC, r.rating DESC)
    SELECT * FROM ans WHERE rownum <= 30
    `;
  queryDB(res, query, '')
};

function getTopRecipesByCat(req, res) {
  var input = req.params.category;
  var query = `
  WITH category_recipes AS (
    SELECT recipeid, recipetitle, rating
    FROM recipes R JOIN (SELECT recipeid
        FROM recipe_categories
        WHERE category = '${input}') C ON R.id = C.recipeid
    ORDER BY rating DESC
)
SELECT * FROM category_recipes
    WHERE rownum <= 50
    `;
  queryDB(res, query, input)
};

function getRecipesWithAllIngredients(req, res) {
  var iList = req.query.ingredientList;
  var rList = req.query.recipeIds;
  var query =
      `
      WITH relevant_recipes AS (
        SELECT recipeid, ingredient
        FROM recipe_ingredients
        WHERE ingredient IN ('${iList}')
    ),
    count_ingr AS (
        SELECT recipeid, COUNT(ingredient) AS num_ingredients_overlap
        FROM relevant_recipes
        GROUP BY recipeid
    )
SELECT id, recipetitle
FROM recipes
        JOIN count_ingr ON id = recipeid AND num_ingredients_overlap = numberofingredients
WHERE recipetitle NOT IN ('${rList}');

      `;
  queryDB(req, query, input)
}

function getIngredientsByRecipe2(req, res) {
  var input = req.query.recipeIds;
  var query = `
  SELECT DISTINCT INITCAP(ingredient)
  FROM recipe_ingredients
  WHERE recipeid IN (${input})
  `;
  console.log(query);
  console.log(input);
  queryDB(res, query, input)
};

module.exports = {
  getTopTen: getTopTen,
  getCategories: getCategories,
  getSearch: getSearch,
  getSearchIngredient: getSearchIngredient,
  getLowCal: getLowCal,
  getHighProtein: getHighProtein,
  getIngredientsByRecipe: getIngredientsByRecipe,
  getLowFat: getLowFat,
  getLowCarb: getLowCarb,
  getLowSugar: getLowSugar,
  getTopRecipesByCat: getTopRecipesByCat,
  getRecipesWithAllIngredients: getRecipesWithAllIngredients,
  getIngredientsByRecipe2: getIngredientsByRecipe2,

}