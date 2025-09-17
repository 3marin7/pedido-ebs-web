import React, { useState, useMemo, useEffect } from 'react';
import './MallMap.css';

const MallMap = () => {
  // Estado para gestionar la edición
  const [isEditing, setIsEditing] = useState(false);
  const [editLocal, setEditLocal] = useState(null);
  const [newClientName, setNewClientName] = useState('');
  
  // Datos iniciales de los clientes (algunos vacíos para locales sin asignar)
  const initialClients = [
    "david", "lux hele lucero", "rosendo", "jomi", "jhon fredy andrea", "Rodrigo",
    "edison", "citto", "camilo", "jhoana", "jorpe", "edison laura",
    "laux", "raul", "novardo", "nathalia", "flor celi", "henry",
    "henry", "raul -camilo", "ANDRE", "esteban artos", "", "",
    "", "", "fior", "adenis", "marijha", "laydi aleja", "albeiro",
    "marcela", "yudy", "norvey norvey", "damiel soler", "", "", "", "", "", ""
  ];

  // Cargar datos desde localStorage o usar los iniciales
  const [clients, setClients] = useState(() => {
    const savedClients = localStorage.getItem('mallClients');
    return savedClients ? JSON.parse(savedClients) : initialClients;
  });

  // Guardar en localStorage cuando cambien los clientes
  useEffect(() => {
    localStorage.setItem('mallClients', JSON.stringify(clients));
  }, [clients]);

  // Estado para la aplicación
  const [selectedLocal, setSelectedLocal] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewFilter, setViewFilter] = useState('all');

  // Generar datos de locales (36 locales como en tu diseño)
  const locals = useMemo(() => {
    return Array.from({ length: 36 }, (_, i) => {
      const localNumber = i + 1;
      const isOccupied = localNumber <= clients.length && clients[localNumber - 1] && clients[localNumber - 1].trim() !== '';
      
      return {
        id: localNumber,
        number: localNumber,
        isOccupied,
        clientName: isOccupied ? clients[localNumber - 1] : null,
        area: (Math.floor(Math.random() * 5) + 5) * 10,
        phone: isOccupied ? `+57 ${3000000000 + localNumber}` : 'N/A'
      };
    });
  }, [clients]);

  // Filtrar locales
  const filteredLocals = useMemo(() => {
    return locals.filter(local => {
      if (viewFilter === 'available' && local.isOccupied) return false;
      if (viewFilter === 'occupied' && !local.isOccupied) return false;
      
      if (searchTerm && local.isOccupied) {
        return local.clientName.toLowerCase().includes(searchTerm.toLowerCase());
      }
      
      return true;
    });
  }, [locals, searchTerm, viewFilter]);

  // Manejar la selección de un local
  const handleSelectLocal = (local) => {
    setSelectedLocal(local);
    setIsEditing(false);
    setEditLocal(null);
    setNewClientName('');
  };

  // Iniciar edición de un local
  const handleEditLocal = (local, e) => {
    e.stopPropagation();
    setEditLocal(local);
    setNewClientName(local.isOccupied ? local.clientName : '');
    setIsEditing(true);
  };

  // Guardar cambios en un local
  const handleSaveEdit = () => {
    if (!editLocal) return;

    const updatedClients = [...clients];
    
    if (newClientName.trim() === '') {
      // Si el nombre está vacío, liberar el local
      if (editLocal.number <= updatedClients.length) {
        updatedClients[editLocal.number - 1] = '';
      }
    } else {
      // Asignar nuevo cliente
      if (editLocal.number > updatedClients.length) {
        // Extender el array si es necesario
        while (updatedClients.length < editLocal.number) {
          updatedClients.push('');
        }
      }
      updatedClients[editLocal.number - 1] = newClientName;
    }

    setClients(updatedClients);
    setIsEditing(false);
    setEditLocal(null);
    setNewClientName('');
  };

  // Cancelar edición
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditLocal(null);
    setNewClientName('');
  };

  // Liberar un local (quitar cliente)
  const handleReleaseLocal = (localNumber, e) => {
    e.stopPropagation();
    const updatedClients = [...clients];
    if (localNumber <= updatedClients.length) {
      updatedClients[localNumber - 1] = '';
      setClients(updatedClients);
    }
  };

  // Restablecer a datos iniciales
  const handleResetData = () => {
    if (window.confirm('¿Estás seguro de que quieres restablecer todos los datos? Se perderán los cambios.')) {
      setClients(initialClients);
    }
  };

  // Renderizar el mapa con diseño de pasillos verdes
  const renderMapGrid = () => {
    return (
      <div className="mall-layout">
        {/* Fila 1 */}
        <div className="mall-row">
          <div className="local-square" onClick={() => handleSelectLocal(locals[0])}>
            <div className="local-num">L-1</div>
            <div className="local-client">{clients[0] || 'Disponible'}</div>
          </div>
          <div className="local-square" onClick={() => handleSelectLocal(locals[1])}>
            <div className="local-num">L-2</div>
            <div className="local-client">{clients[1] || 'Disponible'}</div>
          </div>
          <div className="green-hall"></div>
          <div className="local-square" onClick={() => handleSelectLocal(locals[2])}>
            <div className="local-num">L-3</div>
            <div className="local-client">{clients[2] || 'Disponible'}</div>
          </div>
          <div className="local-square" onClick={() => handleSelectLocal(locals[3])}>
            <div className="local-num">L-4</div>
            <div className="local-client">{clients[3] || 'Disponible'}</div>
          </div>
          <div className="green-hall"></div>
          <div className="local-square" onClick={() => handleSelectLocal(locals[4])}>
            <div className="local-num">L-5</div>
            <div className="local-client">{clients[4] || 'Disponible'}</div>
          </div>
          <div className="local-square" onClick={() => handleSelectLocal(locals[5])}>
            <div className="local-num">L-6</div>
            <div className="local-client">{clients[5] || 'Disponible'}</div>
          </div>
        </div>

        {/* Pasillo horizontal verde */}
        <div className="green-hall horizontal"></div>

        {/* Fila 2 */}
        <div className="mall-row">
          <div className="local-square" onClick={() => handleSelectLocal(locals[6])}>
            <div className="local-num">L-7</div>
            <div className="local-client">{clients[6] || 'Disponible'}</div>
          </div>
          <div className="local-square" onClick={() => handleSelectLocal(locals[7])}>
            <div className="local-num">L-8</div>
            <div className="local-client">{clients[7] || 'Disponible'}</div>
          </div>
          <div className="green-hall"></div>
          <div className="local-square" onClick={() => handleSelectLocal(locals[8])}>
            <div className="local-num">L-9</div>
            <div className="local-client">{clients[8] || 'Disponible'}</div>
          </div>
          <div className="local-square" onClick={() => handleSelectLocal(locals[9])}>
            <div className="local-num">L-10</div>
            <div className="local-client">{clients[9] || 'Disponible'}</div>
          </div>
          <div className="green-hall"></div>
          <div className="local-square" onClick={() => handleSelectLocal(locals[10])}>
            <div className="local-num">L-11</div>
            <div className="local-client">{clients[10] || 'Disponible'}</div>
          </div>
          <div className="local-square" onClick={() => handleSelectLocal(locals[11])}>
            <div className="local-num">L-12</div>
            <div className="local-client">{clients[11] || 'Disponible'}</div>
          </div>
        </div>

        {/* Pasillo horizontal verde */}
        <div className="green-hall horizontal"></div>

        {/* Fila 3 */}
        <div className="mall-row">
          <div className="local-square" onClick={() => handleSelectLocal(locals[12])}>
            <div className="local-num">L-13</div>
            <div className="local-client">{clients[12] || 'Disponible'}</div>
          </div>
          <div className="local-square" onClick={() => handleSelectLocal(locals[13])}>
            <div className="local-num">L-14</div>
            <div className="local-client">{clients[13] || 'Disponible'}</div>
          </div>
          <div className="green-hall"></div>
          <div className="cafeteria-center">
            <div className="cafeteria-text">CAFETERÍA</div>
          </div>
          <div className="green-hall"></div>
          <div className="local-square" onClick={() => handleSelectLocal(locals[14])}>
            <div className="local-num">L-15</div>
            <div className="local-client">{clients[14] || 'Disponible'}</div>
          </div>
          <div className="local-square" onClick={() => handleSelectLocal(locals[15])}>
            <div className="local-num">L-16</div>
            <div className="local-client">{clients[15] || 'Disponible'}</div>
          </div>
        </div>

        {/* Pasillo horizontal verde */}
        <div className="green-hall horizontal"></div>

        {/* Fila 4 */}
        <div className="mall-row">
          <div className="local-square" onClick={() => handleSelectLocal(locals[16])}>
            <div className="local-num">L-17</div>
            <div className="local-client">{clients[16] || 'Disponible'}</div>
          </div>
          <div className="local-square" onClick={() => handleSelectLocal(locals[17])}>
            <div className="local-num">L-18</div>
            <div className="local-client">{clients[17] || 'Disponible'}</div>
          </div>
          <div className="green-hall"></div>
          <div className="local-square" onClick={() => handleSelectLocal(locals[18])}>
            <div className="local-num">L-19</div>
            <div className="local-client">{clients[18] || 'Disponible'}</div>
          </div>
          <div className="local-square" onClick={() => handleSelectLocal(locals[19])}>
            <div className="local-num">L-20</div>
            <div className="local-client">{clients[19] || 'Disponible'}</div>
          </div>
          <div className="green-hall"></div>
          <div className="local-square" onClick={() => handleSelectLocal(locals[20])}>
            <div className="local-num">L-21</div>
            <div className="local-client">{clients[20] || 'Disponible'}</div>
          </div>
          <div className="local-square" onClick={() => handleSelectLocal(locals[21])}>
            <div className="local-num">L-22</div>
            <div className="local-client">{clients[21] || 'Disponible'}</div>
          </div>
        </div>

        {/* Pasillo horizontal verde */}
        <div className="green-hall horizontal"></div>

        {/* Fila 5 */}
        <div className="mall-row">
          <div className="local-square" onClick={() => handleSelectLocal(locals[22])}>
            <div className="local-num">L-23</div>
            <div className="local-client">{clients[22] || 'Disponible'}</div>
          </div>
          <div className="local-square" onClick={() => handleSelectLocal(locals[23])}>
            <div className="local-num">L-24</div>
            <div className="local-client">{clients[23] || 'Disponible'}</div>
          </div>
          <div className="green-hall"></div>
          <div className="local-square" onClick={() => handleSelectLocal(locals[24])}>
            <div className="local-num">L-25</div>
            <div className="local-client">{clients[24] || 'Disponible'}</div>
          </div>
          <div className="local-square" onClick={() => handleSelectLocal(locals[25])}>
            <div className="local-num">L-26</div>
            <div className="local-client">{clients[25] || 'Disponible'}</div>
          </div>
          <div className="green-hall"></div>
          <div className="local-square" onClick={() => handleSelectLocal(locals[26])}>
            <div className="local-num">L-27</div>
            <div className="local-client">{clients[26] || 'Disponible'}</div>
          </div>
          <div className="local-square" onClick={() => handleSelectLocal(locals[27])}>
            <div className="local-num">L-28</div>
            <div className="local-client">{clients[27] || 'Disponible'}</div>
          </div>
        </div>

        {/* Pasillo horizontal verde */}
        <div className="green-hall horizontal"></div>

        {/* Fila 6 */}
        <div className="mall-row">
          <div className="local-square" onClick={() => handleSelectLocal(locals[28])}>
            <div className="local-num">L-29</div>
            <div className="local-client">{clients[28] || 'Disponible'}</div>
          </div>
          <div className="local-square" onClick={() => handleSelectLocal(locals[29])}>
            <div className="local-num">L-30</div>
            <div className="local-client">{clients[29] || 'Disponible'}</div>
          </div>
          <div className="green-hall"></div>
          <div className="local-square" onClick={() => handleSelectLocal(locals[30])}>
            <div className="local-num">L-31</div>
            <div className="local-client">{clients[30] || 'Disponible'}</div>
          </div>
          <div className="local-square" onClick={() => handleSelectLocal(locals[31])}>
            <div className="local-num">L-32</div>
            <div className="local-client">{clients[31] || 'Disponible'}</div>
          </div>
          <div className="green-hall"></div>
          <div className="local-square" onClick={() => handleSelectLocal(locals[32])}>
            <div className="local-num">L-33</div>
            <div className="local-client">{clients[32] || 'Disponible'}</div>
          </div>
          <div className="local-square" onClick={() => handleSelectLocal(locals[33])}>
            <div className="local-num">L-34</div>
            <div className="local-client">{clients[33] || 'Disponible'}</div>
          </div>
        </div>

        {/* Pasillo horizontal verde */}
        <div className="green-hall horizontal"></div>

        {/* Fila 7 */}
        <div className="mall-row">
          <div className="local-square" onClick={() => handleSelectLocal(locals[34])}>
            <div className="local-num">L-35</div>
            <div className="local-client">{clients[34] || 'Disponible'}</div>
          </div>
          <div className="local-square" onClick={() => handleSelectLocal(locals[35])}>
            <div className="local-num">L-36</div>
            <div className="local-client">{clients[35] || 'Disponible'}</div>
          </div>
          <div className="green-hall"></div>
          <div className="empty-space"></div>
          <div className="empty-space"></div>
          <div className="green-hall"></div>
          <div className="empty-space"></div>
          <div className="empty-space"></div>
        </div>
      </div>
    );
  };

  return (
    <div className="mall-map-container">
      <header className="mall-header">
        <h1>Mapa de Locales - Centro Comercial</h1>
        <p className="mall-description">
          Visualiza y gestiona los locales comerciales. 
          {isEditing && <span className="editing-notice"> Modo edición activado</span>}
        </p>
      </header>
      
      <div className="mall-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="Buscar local por nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={isEditing}
          />
        </div>
        <div className="view-options">
          <button 
            className={viewFilter === 'all' ? 'active' : ''}
            onClick={() => setViewFilter('all')}
            disabled={isEditing}
          >
            Ver Todos
          </button>
          <button 
            className={viewFilter === 'available' ? 'active' : ''}
            onClick={() => setViewFilter('available')}
            disabled={isEditing}
          >
            Disponibles
          </button>
          <button 
            className={viewFilter === 'occupied' ? 'active' : ''}
            onClick={() => setViewFilter('occupied')}
            disabled={isEditing}
          >
            Ocupados
          </button>
          <button 
            className={isEditing ? 'active' : ''}
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? 'Cancelar Edición' : 'Modo Edición'}
          </button>
          <button 
            onClick={handleResetData}
            className="reset-btn"
            title="Restablecer datos iniciales"
          >
            ↺
          </button>
        </div>
      </div>
      
      <div className="mall-main-content">
        <div className="locals-list">
          <h2>Lista de Locales {isEditing && <span>(Edición)</span>}</h2>
          <div className="locals-container">
            {filteredLocals.map(local => (
              <div
                key={local.id}
                className={`local-item ${selectedLocal?.id === local.id ? 'selected' : ''}`}
                onClick={() => handleSelectLocal(local)}
              >
                <div className="local-info">
                  <span className="local-number">Local {local.number}</span>
                  <span className="client-name">
                    {local.isOccupied ? local.clientName : 'Disponible'}
                  </span>
                </div>
                {isEditing && (
                  <div className="local-actions">
                    <button 
                      className="edit-btn"
                      onClick={(e) => handleEditLocal(local, e)}
                      title="Editar local"
                    >
                      ✏️
                    </button>
                    {local.isOccupied && (
                      <button 
                        className="release-btn"
                        onClick={(e) => handleReleaseLocal(local.number, e)}
                        title="Liberar local"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        <div className="map-container">
          {renderMapGrid()}
          
          <div className="map-legend">
            <div className="legend-item">
              <div className="legend-color available"></div>
              <span>Disponible</span>
            </div>
            <div className="legend-item">
              <div className="legend-color occupied"></div>
              <span>Ocupado</span>
            </div>
            <div className="legend-item">
              <div className="legend-color selected"></div>
              <span>Seleccionado</span>
            </div>
            <div className="legend-item">
              <div className="green-hall-color"></div>
              <span>Pasillo</span>
            </div>
            <div className="legend-item">
              <div className="cafeteria-color"></div>
              <span>Cafetería</span>
            </div>
          </div>
          
          <div className="local-details">
            <h3>Información del Local</h3>
            {selectedLocal ? (
              <>
                <div className="detail-item">
                  <span className="detail-label">Número:</span>
                  <span>L-{selectedLocal.number}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Estado:</span>
                  <span>{selectedLocal.isOccupied ? 'Ocupado' : 'Disponible'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Cliente:</span>
                  <span>{selectedLocal.isOccupied ? selectedLocal.clientName : 'Por asignar'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Área:</span>
                  <span>{selectedLocal.area} m²</span>
                </div>
                {selectedLocal.isOccupied && (
                  <div className="detail-item">
                    <span className="detail-label">Teléfono:</span>
                    <span>{selectedLocal.phone}</span>
                  </div>
                )}
                {isEditing && (
                  <div className="edit-actions">
                    <button 
                      className="edit-btn"
                      onClick={(e) => handleEditLocal(selectedLocal, e)}
                    >
                      ✏️ Editar este local
                    </button>
                    {selectedLocal.isOccupied && (
                      <button 
                        className="release-btn"
                        onClick={(e) => handleReleaseLocal(selectedLocal.number, e)}
                      >
                        🗑️ Liberar local
                      </button>
                    )}
                  </div>
                )}
              </>
            ) : (
              <p>Selecciona un local para ver sus detalles</p>
            )}
          </div>

          {/* Modal de edición */}
          {isEditing && editLocal && (
            <div className="modal-overlay">
              <div className="modal-content">
                <h3>Editar Local {editLocal.number}</h3>
                <div className="form-group">
                  <label htmlFor="clientName">Nombre del Cliente:</label>
                  <input
                    type="text"
                    id="clientName"
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    placeholder="Dejar vacío para liberar el local"
                    autoFocus
                  />
                </div>
                <div className="modal-actions">
                  <button onClick={handleSaveEdit} className="save-btn">
                    💾 Guardar
                  </button>
                  <button onClick={handleCancelEdit} className="cancel-btn">
                    ❌ Cancelar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <footer className="mall-footer">
        <p>Centro Comercial - Mapa de Locales © 2025</p>
      </footer>
    </div>
  );
};

export default MallMap;