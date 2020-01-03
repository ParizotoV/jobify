// Request , Response
const express = require('express');
// New application
const app = express();
const bodyParser = require('body-parser')

const path = require('path')
const sqlite = require('sqlite');
const dbConenection = sqlite.open(path.resolve(__dirname, 'banco.sqlite'), { Promise })

const port = process.env.PORT || 3000

app.set('view engine', 'ejs')
app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: true }))

// responde ao usuario
app.get('/', async (request, response) => {
  const db = await dbConenection
  const categoriasDb = await db.all('select * from categorias;')
  const vagas = await db.all('select * from vagas;')
  const categorias = categoriasDb.map(cat => {
    return {
      ...cat,
      vagas: vagas.filter(vaga => vaga.categoria === cat.id)
    }
  })
  response.render('home', {
    categorias
  })
})

app.get('/vaga/:id', async (request, response) => {
  const db = await dbConenection
  const vaga = await db.get('SELECT * FROM vagas WHERE id =' + request.params.id)
  response.render('vaga', {
    vaga
  })
})

app.get('/admin', (req, res) => {
  res.render('admin/home')
})

app.get('/admin/vagas', async (req, res) => {
  const db = await dbConenection
  const vagas = await db.all('select * from vagas;')
  res.render('admin/vagas', { vagas })
})

app.get('/admin/vagas/delete/:id', async (req, res) => {
  const db = await dbConenection
  await db.run('DELETE FROM vagas WHERE id = ' + req.params.id)
  res.redirect('/admin/vagas')
})

app.get('/admin/vagas/nova', async (req, res) => {
  const db = await dbConenection
  const categorias = await db.all('select * from categorias;')
  res.render('admin/nova-vaga', { categorias })
})

app.post('/admin/vagas/nova', async (req, res) => {
  const db = await dbConenection
  const { titulo, descricao, categoria } = req.body;
  await db.run(`INSERT INTO vagas (categoria, titulo, descricao) VALUES (${categoria}, '${titulo}', '${descricao}')`)
  res.redirect('/admin/vagas')
})

app.get('/admin/vagas/editar/:id', async (req, res) => {
  const db = await dbConenection
  const categorias = await db.all('select * from categorias;')
  const vaga = await db.get('SELECT * FROM vagas WHERE id =' + req.params.id)
  res.render('admin/editar-vaga', { categorias, vaga })
})

app.post('/admin/vagas/editar/:id', async (req, res) => {
  const db = await dbConenection
  const { titulo, descricao, categoria } = req.body;
  const { id } = req.params;
  await db.run(`UPDATE vagas SET categoria = ${categoria}, titulo = '${titulo}', descricao = '${descricao}' WHERE id = ${id}`)
  res.redirect('/admin/vagas')
})

const init = async () => {
  const db = await dbConenection
  await db.run('create table if not exists categorias(id INTEGER PRIMARY KEY, categoria TEXT)')
  await db.run('create table if not exists vagas(id INTEGER PRIMARY KEY, categoria INTEGER, titulo TEXT, descricao TEXT)')
}
init()
app.listen(port, (err) => {
  if (err) {
    console.log('Nao foi possivel iniciar o servidor do Jobify.')
  } else {
    console.log(`O servidor do Jobify esta rodando.`)
  }
})
