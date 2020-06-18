var express = require('express');
var mysql = require('mysql');
var fs=require('fs');
var cors=require('cors');

var config = require('./config.json') ;
var users = require('./users.json');
var _ = require('lodash');
const { resolve } = require('path');
const { reject, result, values, update } = require('lodash');

var app = express();

var conn = mysql.createConnection(config.db);

//Configure l'app
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

/** Fonction pour gérer les erreurs */
function handleError(err, res){
  console.error(err);
  res.status(500).send(err.message);
}

function query(sqlQuery,values) {
  return new Promise( (resolve, reject) => {
    conn.query(sqlQuery, values, (err, result, fields) => {
      if (err) reject(err);
      resolve(result);
    });  
  });
}

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

function getActivity(req,res) {
  console.log('GET /activity params[idU=%s]', req.query.idU)
  getUserActivity(req.query.idU, res).then( (result) => {
    res.json(result);
  });
}

async function postActivity(req, res) {
  console.log('POST /activity param[activities=%o, idU=%s]',req.body.activities, req.body.idU);
  for (const activity of req.body.activities) {
    if (activity.idA)  await updateActivityAndComments(activity, req.body.idU).catch((err) => handleError(err, res));
    else await insertActivityIntoTable(activity, req.body.idU).catch((err) => handleError(err, res));
  }
  getUserActivity(req.body.idU, res).then( (result) => {
    res.json(result);
  });
}

function getActivityType(req,res) {
  console.log('GET /activity/type');
  query('SELECT * FROM activityType', []).then( (result) => {
    res.json(result);
  })
  .catch((err) => handleError(err, res));
}

function postActivityType(req, res){
  console.log("POST /activity/type - param[code=%s, libelle=%s]", req.body.code, req.body.libelle);
  query("INSERT INTO `activitytype` (`code`, `libelle`) VALUES (?, ?)", [req.body.code, req.body.libelle]).then( ()=>{
    res.json({"message":'Activité créé'});
  }).catch((err) => handleError(err, res));
}

/**
 * Renvoie les informations d'un utilisateur en base.
 * @param {*} req : requête
 * @param {*} res : reponse
 */
function getUser(req, res) {
  console.log('GET /user params[idU=%s]', req.query.idU);
  query('SELECT * FROM `user` where idU=?', [req.query.idU]).then( (result) => {
    if (result.length>0) res.json(result[0]);
    else res.json({});
  });
}

function postUser(req,res) {
  console.log("POST /user - param[idU=%s, password=%s, nom=%s, prenom=%s, role=%s]", req.body.idU, req.body.password, req.body.nom, req.body.prenom, req.body.role);
  if (req.body.idU && req.body.password && req.body.nom && req.body.prenom && req.body.role ){
    query("INSERT INTO user (idU, nom, prenom, role) VALUES (?, ?, ?, ?)", [req.body.idU, req.body.nom, req.body.prenom, req.body.role])
  .then( ()=> {
    users.push( { "idU" : req.body.idU, "password" : req.body.password } );
    fs.writeFile(config.server.locationDir+"users.json", JSON.stringify(users), 'utf8', (err) => {
        if (err) throw err
        console.log("File '%s' has been modified", config.server.locationDir+"users.json");
    });
  })
  .then( res.json({"message":"Utilisateur créé"}) )
  .catch((err) => handleError(err, res));
  }
  else {
    err = new Error('Certains paramètres sont vide');
    err.code = 500;
    handleError(err,res);
  }
}

function getConnection(req,res) {
  console.log('GET /connect - [idU=%s, password=%s]', req.query.idU, req.query.password);
  if ( _.some(users, {"idU": req.query.idU, "password": req.query.password}) ){
    res.status(200).send()
  } else {
    res.status(404).send()
  }
}

/**
 * Renvoie les utilisateurs présent en base.
 * @param {*} req : requête
 * @param {*} res : reponse
 */
function getAllUser(req, res) {
  console.log('GET /user/all');
  query('SELECT * FROM `user`', [req.query.idU]).then( (result) => {
    res.json(result);
  });
}

function getRole(req,res) {
  console.log("GET /role");
  query("SELECT * from role",[]).then( (result) => {
    res.json(result);
  })
}

function  getCalculTempsActivite(req,res) {
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
  });
}

/** Fonction qui permet de renvoyer la liste d'imputation d'un user
 * Est utilisée à chaque get ou post pour synchro la bd et l'appli
 */
function getUserActivity(idU){
  return query('SELECT * FROM activity JOIN comments ON activity.idA = comments.idA WHERE idU =? ORDER BY activity.dateActivity', [idU]);
}

/**
 * Fonction pour insérer une activité en base. Insére aussi son commentaire si celui-ci n'est pas vide.
 * @param {*} activity : activité à insérer
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
 */
function insertCommentsIntoTable(idA, comments) {
  return query("INSERT INTO comments (idA, comments) VALUES (?, ?)", [idA, comments]);
}

/**
 * Mets à jour une activité et son commentaire
 * @param {*} activity  : information de l'activité
 */
function updateActivityAndComments (activity, idU){
  return query("UPDATE activity SET idU=?, period=?, dateActivity=?, activityType=? where activity.idA=?", 
  [idU, activity.period, activity.dateActivity, activity.activityType,activity.idA])
  .then( () => query("UPDATE comments SET comments=? where idA=?",[activity.comments, activity.idA]) )
}

if (users) {
  app.listen(config.server.port);
  console.log("listening on port ", config.server.port);
}
else {
  console.error('La liste des utilisateurs n\'a pas été chargé. Vérifier que le fichier est bien présent.')
}