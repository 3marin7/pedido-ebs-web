import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import './JuegosEBS.css';

const normalizeWord = (word) => word
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLocaleUpperCase('es-CO')
  .replace(/[^A-Z]/g, '');

const WORD_BANK = [
  'PERA', 'MANGO', 'BANANO', 'MANZANA', 'GALLETAS',
  'FRUTA', 'LIBRO', 'LIMON', 'BOLSA', 'TIGRE', 'CAMPO',
  'NOCHE', 'PLATO', 'MELON', 'SABOR', 'CIELO', 'DOLAR',
  'RUMBO', 'CANTO', 'TARDE', 'LISTO', 'FUEGO', 'NARANJA',
  'ACEITE', 'CEREZA', 'TOMATE', 'COCINA', 'JUGUETE',
  'CAMISETA', 'PANTALON',
].map(normalizeWord);

const shuffle = (items) => {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
};

const getRandomWord = (previousWord) => {
  const availableWords = WORD_BANK.filter((word) => word !== previousWord);
  const wordsWithDifferentLength = availableWords.filter(
    (word) => word.length !== previousWord?.length
  );
  const choices = wordsWithDifferentLength.length ? wordsWithDifferentLength : availableWords;
  return choices[Math.floor(Math.random() * choices.length)];
};

const getProductName = (product) => product?.nombre?.trim() || 'Producto sin nombre';

const JuegoMemoria = ({ products }) => {
  const [cards, setCards] = useState([]);
  const [openedCards, setOpenedCards] = useState([]);
  const [matchedCards, setMatchedCards] = useState([]);
  const [moves, setMoves] = useState(0);
  const mismatchTimer = useRef(null);

  useEffect(() => () => {
    if (mismatchTimer.current) window.clearTimeout(mismatchTimer.current);
  }, []);

  const startGame = () => {
    if (mismatchTimer.current) window.clearTimeout(mismatchTimer.current);
    const pairCount = Math.min(9, products.length);
    const selectedProducts = shuffle(products).slice(0, pairCount);
    const board = shuffle(selectedProducts.flatMap((product, index) => [
      { id: `${product.id}-${index}-a`, pairId: `${product.id}-${index}`, product },
      { id: `${product.id}-${index}-b`, pairId: `${product.id}-${index}`, product },
    ]));
    setCards(board);
    setOpenedCards([]);
    setMatchedCards([]);
    setMoves(0);
  };

  const handleCardClick = (card) => {
    if (
      openedCards.length === 2
      || openedCards.includes(card.id)
      || matchedCards.includes(card.id)
    ) return;

    const nextOpened = [...openedCards, card.id];
    setOpenedCards(nextOpened);
    if (nextOpened.length !== 2) return;

    setMoves((current) => current + 1);
    const [firstId, secondId] = nextOpened;
    const firstCard = cards.find((item) => item.id === firstId);
    const secondCard = cards.find((item) => item.id === secondId);
    if (firstCard?.pairId === secondCard?.pairId) {
      setMatchedCards((current) => [...current, firstId, secondId]);
      setOpenedCards([]);
      return;
    }

    mismatchTimer.current = window.setTimeout(() => setOpenedCards([]), 850);
  };

  const complete = cards.length > 0 && matchedCards.length === cards.length;

  return (
    <section className="juego-panel">
      <div className="juego-panel-heading">
        <div>
          <p className="juego-eyebrow">Encuentra las parejas</p>
          <h2>Memoria de productos</h2>
          <p>Encuentra hasta 9 parejas de productos. Voltea dos tarjetas por turno.</p>
        </div>
        <button className="juego-button juego-button-secondary" type="button" onClick={startGame}>
          {cards.length ? 'Empezar de nuevo' : 'Iniciar juego'}
        </button>
      </div>
      {products.length < 2 ? (
        <p className="juego-notice">Se necesitan al menos dos productos activos para jugar.</p>
      ) : (
        <>
          <div className="juego-scoreline">
            <span>Parejas: <strong>{Math.min(9, products.length)}</strong></span>
            <span>Intentos: <strong>{moves}</strong></span>
            {complete && <strong className="juego-success">¡Completaste el tablero!</strong>}
          </div>
          {cards.length === 0 ? (
            <div className="juego-empty-board">Toca “Iniciar juego” para comenzar.</div>
          ) : (
            <div className="memoria-grid">
              {cards.map((card) => {
                const isVisible = openedCards.includes(card.id) || matchedCards.includes(card.id);
                return (
                  <button
                    aria-label={isVisible ? getProductName(card.product) : 'Tarjeta oculta'}
                    aria-pressed={isVisible}
                    className={`memoria-card ${isVisible ? 'memoria-card-visible' : ''} ${matchedCards.includes(card.id) ? 'memoria-card-matched' : ''}`}
                    key={card.id}
                    onClick={() => handleCardClick(card)}
                    type="button"
                  >
                    {isVisible ? (
                      <>
                        {card.product.imagen_url ? (
                          <img src={card.product.imagen_url} alt="" />
                        ) : (
                          <span className="memoria-placeholder" aria-hidden="true">📦</span>
                        )}
                        <span>{getProductName(card.product)}</span>
                      </>
                    ) : <span className="memoria-hidden" aria-hidden="true">?</span>}
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}
    </section>
  );
};

const SUDOKU_PUZZLE = [
  '530070000',
  '600195000',
  '098000060',
  '800060003',
  '400803001',
  '700020006',
  '060000280',
  '000419005',
  '000080079',
];

const SUDOKU_SOLUTION = [
  '534678912',
  '672195348',
  '198342567',
  '859761423',
  '426853791',
  '713924856',
  '961537284',
  '287419635',
  '345286179',
];

const createSudokuBoard = () => SUDOKU_PUZZLE.map((row) => row.split(''));

const JuegoSudoku = () => {
  const [board, setBoard] = useState(createSudokuBoard);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [message, setMessage] = useState('');
  const isComplete = board.every((row, rowIndex) => row.join('') === SUDOKU_SOLUTION[rowIndex]);

  const updateCell = (rowIndex, columnIndex, value) => {
    const digit = value.replace(/[^1-9]/g, '').slice(-1);
    setBoard((currentBoard) => currentBoard.map((row, currentRow) => (
      currentRow === rowIndex
        ? row.map((cell, currentColumn) => (
          currentColumn === columnIndex ? digit : cell
        ))
        : row
    )));
    setMessage('');
  };

  const reviewBoard = () => {
    const emptyCells = board.flat().filter((cell) => !cell).length;
    const incorrectCells = board.reduce((count, row, rowIndex) => (
      count + row.reduce((rowCount, cell, columnIndex) => (
        rowCount + (cell && cell !== SUDOKU_SOLUTION[rowIndex][columnIndex] ? 1 : 0)
      ), 0)
    ), 0);
    setHasReviewed(true);
    if (emptyCells > 0) {
      setMessage(`Te faltan ${emptyCells} casillas por completar.`);
    } else if (incorrectCells > 0) {
      setMessage(`Hay ${incorrectCells} casillas incorrectas. Revisa las marcadas en rojo.`);
    } else {
      setMessage('¡Excelente! Completaste el Sudoku.');
    }
  };

  const resetBoard = () => {
    setBoard(createSudokuBoard());
    setHasReviewed(false);
    setMessage('');
  };

  return (
    <section className="juego-panel">
      <div className="juego-panel-heading">
        <div>
          <p className="juego-eyebrow">Pon a prueba tu lógica</p>
          <h2>Sudoku</h2>
          <p>Completa la cuadrícula: cada fila, columna y bloque debe contener del 1 al 9.</p>
        </div>
        <button className="juego-button juego-button-secondary" onClick={resetBoard} type="button">
          Reiniciar
        </button>
      </div>
      <div aria-label="Tablero de Sudoku" className="sudoku-board" role="grid">
        {board.map((row, rowIndex) => row.map((value, columnIndex) => {
          const isFixed = SUDOKU_PUZZLE[rowIndex][columnIndex] !== '0';
          const isIncorrect = hasReviewed
            && value
            && value !== SUDOKU_SOLUTION[rowIndex][columnIndex];
          return (
            <div
              aria-readonly={isFixed}
              className={[
                'sudoku-cell',
                isFixed ? 'sudoku-cell-fixed' : '',
                isIncorrect ? 'sudoku-cell-incorrect' : '',
                rowIndex === 2 || rowIndex === 5 ? 'sudoku-cell-row-divider' : '',
                columnIndex === 2 || columnIndex === 5 ? 'sudoku-cell-column-divider' : '',
              ].filter(Boolean).join(' ')}
              key={`${rowIndex}-${columnIndex}`}
              role="gridcell"
            >
              <input
                aria-label={`Fila ${rowIndex + 1}, columna ${columnIndex + 1}`}
                autoComplete="off"
                inputMode="numeric"
                maxLength={1}
                onChange={(event) => updateCell(rowIndex, columnIndex, event.target.value)}
                readOnly={isFixed}
                value={value === '0' ? '' : value}
              />
            </div>
          );
        }))}
      </div>
      <div className="sudoku-controls">
        <button className="juego-button" disabled={isComplete} onClick={reviewBoard} type="button">
          Revisar tablero
        </button>
      </div>
      <p aria-live="polite" className={`sudoku-message ${isComplete ? 'sudoku-message-success' : ''}`} role="status">
        {isComplete ? '¡Excelente! Completaste el Sudoku.' : message || 'Las casillas azules ya están resueltas; completa las demás.'}
      </p>
    </section>
  );
};

const JuegoPalabra = () => {
  const [target, setTarget] = useState(() => getRandomWord());
  const [guess, setGuess] = useState('');
  const [guesses, setGuesses] = useState([]);
  const [message, setMessage] = useState('');
  const nextWordTimer = useRef(null);
  const won = guesses.includes(target);
  const isComplete = won || guesses.length === 6;

  useEffect(() => () => {
    if (nextWordTimer.current) window.clearTimeout(nextWordTimer.current);
  }, []);

  const startNextWord = () => {
    if (nextWordTimer.current) window.clearTimeout(nextWordTimer.current);
    setTarget((currentTarget) => getRandomWord(currentTarget));
    setGuess('');
    setGuesses([]);
    setMessage('');
  };

  const submitGuess = (event) => {
    event.preventDefault();
    const normalized = normalizeWord(guess);
    if (isComplete) return;
    if (normalized.length !== target.length) {
      setMessage(`Escribe una palabra de ${target.length} letras.`);
      return;
    }
    const nextGuesses = [...guesses, normalized];
    setGuesses(nextGuesses);
    setGuess('');
    if (normalized === target) {
      setMessage('¡Lo lograste! Descubriste la palabra. Enseguida tendrás otro reto.');
      nextWordTimer.current = window.setTimeout(startNextWord, 1800);
    } else if (nextGuesses.length === 6) {
      setMessage(`Se acabaron los intentos. La palabra era ${target}.`);
    } else {
      setMessage('');
    }
  };

  return (
    <section className="juego-panel">
      <div className="juego-panel-heading">
        <div>
          <p className="juego-eyebrow">Un reto nuevo en cada partida</p>
          <h2>Palabra del día</h2>
          <p>Adivina la palabra de {target.length} letras en seis intentos. La cantidad cambia en cada reto.</p>
        </div>
        <div className="juego-score-badge">Intentos: {guesses.length}/6</div>
      </div>
      <div
        aria-label="Intentos realizados"
        className="palabra-grid"
      >
        {Array.from({ length: 6 }, (_, rowIndex) => {
          const row = guesses[rowIndex] || '';
          return (
            <div
              className="palabra-row"
              key={`fila-${rowIndex}`}
              style={{
                gridTemplateColumns: `repeat(${target.length}, minmax(0, 1fr))`,
                width: `min(100%, ${target.length * 48 + (target.length - 1) * 7.2}px)`,
              }}
            >
              {Array.from({ length: target.length }, (_, columnIndex) => {
                const letter = row[columnIndex] || '';
                const letterState = !letter
                  ? ''
                  : letter === target[columnIndex]
                    ? 'palabra-correcta'
                    : target.includes(letter) ? 'palabra-presente' : 'palabra-ausente';
                return (
                  <span className={`palabra-tile ${letterState}`} key={`letra-${columnIndex}`}>
                    {letter}
                  </span>
                );
              })}
            </div>
          );
        })}
      </div>
      <form className="palabra-form" onSubmit={submitGuess}>
        <label className="sr-only" htmlFor="palabra-adivinanza">Tu palabra de {target.length} letras</label>
        <input
          autoComplete="off"
          disabled={isComplete}
          id="palabra-adivinanza"
          maxLength={target.length}
          onChange={(event) => {
            setGuess(normalizeWord(event.target.value).slice(0, target.length));
            setMessage('');
          }}
          placeholder={`${target.length} LETRAS`}
          value={guess}
        />
        <button className="juego-button" disabled={isComplete} type="submit">Probar</button>
      </form>
      {guesses.length === 6 && !won && (
        <div className="palabra-next-round">
          <button className="juego-button juego-button-secondary" onClick={startNextWord} type="button">
            Jugar otra palabra
          </button>
        </div>
      )}
      <p aria-live="polite" className="palabra-message" role="status">
        {message || 'Verde: letra y lugar correctos · Amarillo: está en otra posición'}
      </p>
    </section>
  );
};

const TRIKI_WINNING_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

const JuegoTriqui = () => {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState('X');
  const winner = TRIKI_WINNING_LINES
    .map((line) => line.every((index) => board[index] === board[line[0]]) ? board[line[0]] : null)
    .find(Boolean);
  const isDraw = !winner && board.every(Boolean);

  const playCell = (index) => {
    if (board[index] || winner || isDraw) return;
    const nextBoard = [...board];
    nextBoard[index] = currentPlayer;
    setBoard(nextBoard);
    setCurrentPlayer(currentPlayer === 'X' ? 'O' : 'X');
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setCurrentPlayer('X');
  };

  const status = winner
    ? `¡Ganó el jugador ${winner}!`
    : isDraw
      ? '¡Empate! No quedan casillas.'
      : `Turno del jugador ${currentPlayer}`;

  return (
    <section className="juego-panel">
      <div className="juego-panel-heading">
        <div>
          <p className="juego-eyebrow">Reto para dos jugadores</p>
          <h2>Triqui</h2>
          <p>Por turnos, cada jugador marca una casilla. Gana quien forme una línea de tres.</p>
        </div>
        <button className="juego-button juego-button-secondary" onClick={resetGame} type="button">
          Reiniciar
        </button>
      </div>
      <p aria-live="polite" className={`triqui-status ${winner ? 'triqui-status-winner' : ''}`} role="status">
        {status}
      </p>
      <div aria-label="Tablero de triqui" className="triqui-board" role="grid">
        {board.map((cell, index) => (
          <button
            aria-label={`Casilla ${index + 1}${cell ? `, ${cell}` : ', vacía'}`}
            className={`triqui-cell ${cell ? `triqui-cell-${cell.toLowerCase()}` : ''}`}
            key={index}
            onClick={() => playCell(index)}
            role="gridcell"
            type="button"
          >
            {cell}
          </button>
        ))}
      </div>
    </section>
  );
};

const GAMES = [
  { id: 'memoria', icon: '🧠', title: 'Memoria de productos', description: 'Encuentra las parejas iguales del catálogo.' },
  { id: 'sudoku', icon: '🧩', title: 'Sudoku', description: 'Completa la cuadrícula y pon a prueba tu lógica.' },
  { id: 'palabra', icon: '🔤', title: 'Palabra del día', description: 'Descubre la palabra en seis intentos.' },
  { id: 'triqui', icon: '⭕', title: 'Triqui', description: 'Desafía a un amigo a formar una línea de tres.' },
];

const JuegosEBS = () => {
  const [activeGame, setActiveGame] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const loadProducts = async () => {
      try {
        const { data, error: queryError } = await supabase
          .from('productos')
          .select('id, nombre, categoria, imagen_url')
          .eq('activo', true)
          .order('nombre', { ascending: true });
        if (queryError) throw queryError;
        if (active) setProducts(data || []);
      } catch (loadError) {
        console.error('No se pudieron cargar los productos para los juegos:', loadError);
        if (active) setError('No pudimos cargar el catálogo. Intenta recargar la página.');
      } finally {
        if (active) setLoading(false);
      }
    };
    loadProducts();
    return () => { active = false; };
  }, []);

  const selectedGame = GAMES.find((game) => game.id === activeGame);

  return (
    <main className="juegos-page">
      <header className="juegos-hero">
        <div className="juegos-hero-copy">
          <span className="juegos-kicker">Pausa para jugar</span>
          <h1>Juegos EBS</h1>
          <p>Diviértete con el catálogo y pon a prueba tu memoria, lógica y vocabulario.</p>
        </div>
        <span className="juegos-hero-emoji" aria-hidden="true">🎮</span>
      </header>

      {!activeGame ? (
        <>
          <div className="juegos-grid">
            {GAMES.map((game) => (
              <article className="juegos-card" key={game.id}>
                <span className="juegos-card-icon" aria-hidden="true">{game.icon}</span>
                <h2>{game.title}</h2>
                <p>{game.description}</p>
                <button className="juego-button" onClick={() => setActiveGame(game.id)} type="button">
                  Jugar
                  <span aria-hidden="true">→</span>
                </button>
              </article>
            ))}
          </div>
          {loading && <p className="juego-notice" role="status">Cargando productos del catálogo…</p>}
          {error && <p className="juego-error" role="alert">{error}</p>}
        </>
      ) : (
        <div className="juegos-play-area">
          <button className="juegos-back-button" onClick={() => setActiveGame(null)} type="button">
            ← Todos los juegos
          </button>
          {selectedGame && (
            <div className="juego-title-mobile">
              <span aria-hidden="true">{selectedGame.icon}</span>
              <span>{selectedGame.title}</span>
            </div>
          )}
          {error && activeGame !== 'palabra' && <p className="juego-error" role="alert">{error}</p>}
          {activeGame === 'memoria' && (
            loading ? <p className="juego-notice" role="status">Cargando productos…</p> : <JuegoMemoria products={products} />
          )}
          {activeGame === 'sudoku' && <JuegoSudoku />}
          {activeGame === 'palabra' && <JuegoPalabra />}
          {activeGame === 'triqui' && <JuegoTriqui />}
        </div>
      )}
    </main>
  );
};

export default JuegosEBS;
