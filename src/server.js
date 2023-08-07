const http = require('http');
const { nanoid } = require('nanoid');

const books = [];

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json; charset=utf-8'); 

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.url === '/books') {
    if (req.method === 'GET') {
      const urlParams = new URLSearchParams(req.url.split('?')[1]);
      const nameFilter = urlParams.get('name') || '';
      const readingFilter = urlParams.get('reading');
      const finishedFilter = urlParams.get('finished');

      let filteredBooks = [...books];

      if (nameFilter) {
        const lowerCaseNameFilter = nameFilter.toLowerCase();
        filteredBooks = filteredBooks.filter(
          (book) => book.name.toLowerCase().includes(lowerCaseNameFilter)
        );
      }

      if (readingFilter !== null) {
        const readingValue = readingFilter === '1';
        filteredBooks = filteredBooks.filter((book) => book.reading === readingValue);
      }

      if (finishedFilter !== null) {
        const finishedValue = finishedFilter === '1';
        filteredBooks = filteredBooks.filter((book) => book.finished === finishedValue);
      }

      const response = {
        status: 'success',
        data: { books: filteredBooks.map(({ id, name, publisher }) => ({ id, name, publisher })) },
      };

      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' }); 
      res.end(JSON.stringify(response));
    } else if (req.method === 'POST') {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk.toString();
      });
      req.on('end', () => {
        const bookData = JSON.parse(body);
        if (!bookData.name) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' }); 
          res.end(
            JSON.stringify({
              status: 'fail',
              message: 'Gagal menambahkan buku. Mohon isi nama buku',
            })
          );
        } else if (bookData.readPage > bookData.pageCount) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' }); 
          res.end(
            JSON.stringify({
              status: 'fail',
              message: 'Gagal menambahkan buku. readPage tidak boleh lebih besar dari pageCount',
            })
          );
        } else {
          const newBook = {
            id: nanoid(),
            ...bookData,
            finished: bookData.pageCount === bookData.readPage,
            insertedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          books.push(newBook);

          res.writeHead(201, { 'Content-Type': 'application/json; charset=utf-8' }); 
          res.end(
            JSON.stringify({
              status: 'success',
              message: 'Buku berhasil ditambahkan',
              data: { bookId: newBook.id },
            })
          );
        }
      });
    }
  } else if (req.url.startsWith('/books/')) {
    const bookId = req.url.split('/')[2];

    if (req.method === 'GET') {
      const book = books.find((book) => book.id === bookId);
      if (book) {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' }); 
        res.end(JSON.stringify({ status: 'success', data: { book } }));
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' }); 
        res.end(JSON.stringify({ status: 'fail', message: 'Buku tidak ditemukan' }));
      }
    } else if (req.method === 'PUT') {
      const bookIndex = books.findIndex((book) => book.id === bookId);
      if (bookIndex !== -1) {
        let body = '';
        req.on('data', (chunk) => {
          body += chunk.toString();
        });
        req.on('end', () => {
          const bookData = JSON.parse(body);
          if (!bookData.name) {
            res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' }); 
            res.end(
              JSON.stringify({
                status: 'fail',
                message: 'Gagal memperbarui buku. Mohon isi nama buku',
              })
            );
          } else if (bookData.readPage > bookData.pageCount) {
            res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' }); 
            res.end(
              JSON.stringify({
                status: 'fail',
                message: 'Gagal memperbarui buku. readPage tidak boleh lebih besar dari pageCount',
              })
            );
          } else {
            books[bookIndex] = {
              ...books[bookIndex],
              ...bookData,
              finished: bookData.pageCount === bookData.readPage,
              updatedAt: new Date().toISOString(),
            };
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' }); 
            res.end(
              JSON.stringify({
                status: 'success',
                message: 'Buku berhasil diperbarui',
              })
            );
          }
        });
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' }); 
        res.end(JSON.stringify({ status: 'fail', message: 'Gagal memperbarui buku. Id tidak ditemukan' }));
      }
    } else if (req.method === 'DELETE') {
      const bookIndex = books.findIndex((book) => book.id === bookId);
      if (bookIndex !== -1) {
        books.splice(bookIndex, 1);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' }); 
        res.end(
          JSON.stringify({
            status: 'success',
            message: 'Buku berhasil dihapus',
          })
        );
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' }); 
        res.end(
          JSON.stringify({ 
            status: 'fail', 
            message: 'Buku gagal dihapus. Id tidak ditemukan' 
          })
        );
      }
    }
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' }); 
    res.end(JSON.stringify({ status: 'fail', message: 'Halaman tidak ditemukan' }));
  }
});

const PORT = 9000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
