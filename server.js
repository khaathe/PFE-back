var express = require('express');
var mysql = require('mysql');
var fs=require('fs');
var cors=require('cors');

var config = require('./config.json') ;
var users = require('./users.json');
var _ = require('lodash');
const { resolve } = require('path');
const { reject, result, values, update } = require('lodash');
const { error } = require('console');

var app = express();

var conn = mysql.createConnection(config.db);

//Configure l'app
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

/** Route pour les activités */
app.route('/activity')
  .get(getActivity)
  .post(postActivity)

  
/** Route pour la gestion des types d'activités */
app.route('/activity/type')
  .get(getActivityType)
  .post(postActivityType)

/** Route pour les Utilisateurs */
app.route('/user')
  .get(getUser)
  .post(postUser)

app.route('/user/password')
  .post(postUserPassword)

/** Route pour la connection */
app.route('/connect')
  .get(getConnection)

/** Route pour tout les Utilisateurs */
app.route('/user/all')
  .get(getAllUser)

/** Route pour les roles */
app.route('/role')
.get(getRole)

 /** Route pour le calcul du temps de l'activité */
app.route('/calcul-temps-activite')
  .get(getCalculTempsActivite)

app.use(logError)
app.use(handleError)

/**
 * Logger des erreurs
 * @param {*} err erreur
 * @param {*} req requête
 * @param {*} res réponse
 * @param {*} next gestion des routes
 */
function logError(err, req, res, next) {
  console.error("%o", err);
  next(err)  
}

/**
 * Gestion des erreurs
 * @param {*} err erreur
 * @param {*} req requête
 * @param {*} res réponse
 * @param {*} next gestion des routes
 */
function handleError(err, req, res, next) {
  res.status(500).send({
    "status" : err.status,
    "message" : err.message
  })
  //res.render('error', { error: err });
}

/**
 * Méthodes pour centraliser la manière d'éxecuter les requêtes.
 * Renvoie une promesse qui est résolue  avec le réxultat de la requête ou
 * rejetée avec l'erreur lancée par la requête.
 * @param {string} sqlQuery : requête sql
 * @param {Array<*>} values : valeurs à injecter dans la requête
 */
function query(sqlQuery,values) {
  return new Promise( (resolve, reject) => {
    conn.query(sqlQuery, values, (err, result, fields) => {
      if (err) reject(err);
      resolve(result);
    });  
  });
}

/**
 * Renvoie les activités d'un utilisateur.
 * @param {*} req requête
 * @param {*} res réponse
 * @param {*} next gestion des routes
 */
function getActivity(req,res, next) {
  console.log('GET /activity params[idU=%s]', req.query.idU)
  getUserActivity(req.query.idU, res).then( (result) =>  res.json(result)).catch( (err) => next(err) );
}

/**
 * Insére ou met à jour une activité en base.
 * @param {*} req requête
 * @param {*} res réponse
 * @param {*} next gestion des routes
 */
async function postActivity(req, res, next) {
  console.log('POST /activity param[activities=%o, idU=%s]',req.body.activities, req.body.idU);
  for (const activity of req.body.activities) {
    if (activity.idA)  
      await updateActivityAndComments(activity, req.body.idU).catch((err) => {
        err.message = "Impossible de mettre à jour l'activité, la BD a retourné le message suivant : "+ err.message;
        next(err);
      });
    else await insertActivityIntoTable(activity, req.body.idU).catch((err) => {
      err.message = "Impossible de créer l'activité, la BD a retourné le message : "+ err.message;
      next(err);
    });
  }
  getUserActivity(req.body.idU, res).then( (result) => {
    res.json(result);
  }).catch( (err) =>{
    err.message = "La base a retourné le message suivant : " + err.message;
    next(err);
  });
}

/**
 * Renvoie les types d'activités présent en base.
 * @param {*} req requête
 * @param {*} res réponse
 * @param {*} next gestion des routes
 */
function getActivityType(req,res, next) {
  console.log('GET /activity/type');
  query('SELECT * FROM activityType', []).then( (result) =>  res.json(result) ).catch((err) => {
    err.message = "Impossible de récupérer les types d'activités, la BD a retourné le messsage : "+ err.message;
    next(err);
  });
}

/**
 * Insére un nouveau type d'activité en base.
 * @param {*} req requête
 * @param {*} res réponse
 * @param {*} next gestion des routes
 */
function postActivityType(req, res, next){
  console.log("POST /activity/type - param[code=%s, libelle=%s]", req.body.code, req.body.libelle);
  query("INSERT INTO `activitytype` (`code`, `libelle`) VALUES (?, ?)", [req.body.code, req.body.libelle])
  .then( ()=> res.json({"message":'Activité créé'}) ).catch((err) => {
    err.message = "Impossible de créer le type d'activité, la BD a retourné le messsage : "+ err.message;
    next(err);
  });
}

/**
 * Renvoie les informations d'un utilisateur en base.
 * @param {*} req requête
 * @param {*} res réponse
 * @param {*} next gestion des routes
 */
function getUser(req, res, next) {
  console.log('GET /user params[idU=%s]', req.query.idU);
  query('SELECT * FROM `user` where idU=?', [req.query.idU]).then( (result) => {
    if (result.length>0) res.json(result[0]);
    else res.json({});
  }).catch((err) => {
    err.message = "Impossible de récupérer les informations de l'utilisateur" + req.query.idU 
    + ", la BD a retourné le messsage : " + err.message;
    next(err);
  });
}

/**
 * Créé un nouvel utilisateur en base et dans le fichier des utilisateurs.
 * @param {*} req requête
 * @param {*} res réponse
 * @param {*} next gestion des routes
 */
function postUser(req,res, next) {
  console.log("POST /user - param[idU=%s, password=%s, nom=%s, prenom=%s, role=%s]", req.body.idU, req.body.password, req.body.nom, req.body.prenom, req.body.role);
  if (req.body.idU && req.body.password && req.body.nom && req.body.prenom && req.body.role ){
    query("INSERT INTO user (idU, nom, prenom, role) VALUES (?, ?, ?, ?)", [req.body.idU, req.body.nom, req.body.prenom, req.body.role])
    .then( ()=> {
      //On modifie pas directement la liste des users, on la met à jour si l'écriture à fonctionné
      let newUsers = users;
      newUsers.push( { "idU" : req.body.idU, "password" : req.body.password } );
      writeJsonFile(config.server.locationDir+"users.json", newUsers, users);
    })
    .then( res.json({"message":"Utilisateur créé"}) )
    .catch((err) => {
      err.message = "Impossible de créer l'utilisateur '" + req.body.idU + "', la BD a retourné le messsage : "+ err.message;
      next(err);
    });
  }
  else {
    err = new Error('Certains paramètres sont vide');
    err.code = 500;
    next(err);
  }
}

/**
 * Modifie le mot de passe d'un utilisateur.
 * @param {*} req requête
 * @param {*} res réponse
 * @param {*} next gestion des routes
 */
function postUserPassword(req, res, next) {
  console.log('POST /user/passsword - param[idU=%s, password=%s]',req.body.idU, req.body.password)
  let userIndex = _.findIndex(users, { "idU" : req.body.idU});
  if(userIndex === -1){
    let err = new Error('Utilisateur non trouvé');
    err.status = "USER_NOT_FOUND";
    next(err);
  }
  else {
    //On modifie pas directement la liste des users, on la met à jour si l'écriture à fonctionné
    let newUsers = users;
    newUsers[userIndex].password = req.body.password;
    writeJsonFile(config.server.locationDir+"users.json", newUsers, users);
    res.json({'message':'Mot de passe modifié'});
  }
}

/**
 * Renvoie le statut ok (200) si l'utilisateur et le mot de passe éxiste dans le fichier des utilisateurs.
 * @param {*} req requête
 * @param {*} res réponse
 * @param {*} next gestionnaires des routes
 */
function getConnection(req,res, next) {
  console.log('GET /connect - [idU=%s, password=%s]', req.query.idU, req.query.password);
  if ( _.some(users, {"idU": req.query.idU, "password": req.query.password}) ){
    res.json({"messsage":"Utilisateur trouvé"});
  } else {
    let err = new Error('Utilisateur non trouvé');
    err.status = "USER_NOT_FOUND";
    next(err);
  }
}

/**
 * Renvoie les utilisateurs présent en base.
 * @param {*} req requête
 * @param {*} res réponse
 * @param {*} next gestion des routes
 */
function getAllUser(req, res, next) {
  console.log('GET /user/all');
  query('SELECT * FROM `user`', [req.query.idU]).then( (result) => {
    res.json(result);
  }).catch( (err) => next(err))
}

/**
 * Renvoie tous les rôles utilisateurs présents dans la base.
 * @param {*} req requête
 * @param {*} res réponse
 * @param {*} next gestion des routes
 */
function getRole(req,res, next) {
  console.log("GET /role");
  query("SELECT * from role",[]).then( (result) => {
    res.json(result);
  }).catch( (error) => next(error) );
}

/**
 * Renvoie le nombre d'activité groupées par personne et par activité.
 * Si l'id de l'utilisateur est envouyé en paramètre, alors ne renvoie que le temps de l'utilisateur.
 * @param {*} req requête
 * @param {*} res réponse
 * @param {*} next gestion des routes
 */
function  getCalculTempsActivite(req,res, next) {
  console.log('GET /calcul-temps-activite params[dateMin=%s, dateMax=%s, idU=%s]', req.query.dateMin, req.query.dateMax, req.query.idU);
  selectClause = "SELECT idU, nom, prenom, libelle, COUNT(DISTINCT idA) as nbActivity ";
  fromClause = "FROM activity NATURAL JOIN user JOIN activitytype ON (activitytype.code=activity.activityType) ";
  whereClause = "WHERE activity.dateActivity>=? and activity.dateActivity<=? "
  let values=[req.query.dateMin, req.query.dateMax]
  if(req.query.idU) {
    whereClause = whereClause+ "and activity.idU=? "
    values.push(req.query.idU);
  }
  groupClause = "GROUP BY idU,activityType";
  sqlQuery = selectClause + fromClause + whereClause + groupClause
  query(sqlQuery, values)
  .then( (result) => {
    res.json(result);
  }).catch((err) => {
    err.message = "Impossible de calculer le temps passée par activité, la BD a retourné le messsage : "+ err.message;
    next(err);
  });
}

/** Fonction qui permet de renvoyer la liste d'imputation d'un user
 * Est utilisée à chaque get ou post pour synchro la bd et l'appli.
 * @param {string} idU : id utilisateur
 * @returns une promesse
 */
function getUserActivity(idU){
  return query('SELECT * FROM activity JOIN comments ON activity.idA = comments.idA WHERE idU =? ORDER BY activity.dateActivity', [idU]);
}

/**
 * Fonction pour insérer une activité en base. Insére aussi son commentaire si celui-ci n'est pas vide.
 * Renvoie une promesse.
 * @param {*} activity : activité à insérer
 * @param {string} idU : id utilisateur
 * @returns une promesse
 */
function insertActivityIntoTable (activity, idU) {
  return query("INSERT INTO `activity` (`idU`, `period`, `dateActivity`, `activityType`) VALUES (?, ?, ?, ?)", 
  [idU, activity.period, activity.dateActivity, activity.activityType])
  .then( (result) => {
    if (activity.comments) insertCommentsIntoTable(result.insertId, activity.comments)
    else  insertCommentsIntoTable(result.insertId, "")
  });
  
}

/**
 * Insère un commentaire en base
 * @param {*} idA : id de l'activité
 * @param {*} comments : commentaire de l'activité
 * @returns une promesse
 */
function insertCommentsIntoTable(idA, comments) {
  return query("INSERT INTO comments (idA, comments) VALUES (?, ?)", [idA, comments]);
}

/**
 * Mets à jour une activité et son commentaire
 * @param {*} activity  : information de l'activité
 * @param {string} idU : id utilisateur
 * @returns une promesse
 */
function updateActivityAndComments (activity, idU){
  return query("UPDATE activity SET idU=?, period=?, dateActivity=?, activityType=? where activity.idA=?", 
  [idU, activity.period, activity.dateActivity, activity.activityType,activity.idA])
  .then( () => query("UPDATE comments SET comments=? where idA=?",[activity.comments, activity.idA]) )
}

/**
 * Ecrit un objet dans un fichier au format json
 * @param {string} filePath : chemin vers le fichier à écrire
 * @param {*} jsonObject : object à écrire
 * @param {*} originalJsonObject : objet original à update
 */
function writeJsonFile(filePath, jsonObject, originalJsonObject) {
  fs.writeFile(filePath, JSON.stringify(jsonObject), 'utf8', (err) => {
    if (err) next(err);
    originalJsonObject = jsonObject;
    console.log("File '%s' has been modified", filePath);
});
}

if (users) {
  app.listen(config.server.port);
  console.log("listening on port ", config.server.port);
}
else {
  console.error('La liste des utilisateurs n\'a pas été chargé. Vérifier que le fichier est bien présent.')
}