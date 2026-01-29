import React, { useState, useMemo, useEffect } from 'react';
import './MallMap.css';

const MallMap = () => {
  // Estado para gestionar la edición
  const [isEditing, setIsEditing] = useState(false);
  const [editLocal, setEditLocal] = useState(null);
  const [newClientName, setNewClientName] = useState('');
  const [showClientTable, setShowClientTable] = useState(false);
  const [selectedClientFromTable, setSelectedClientFromTable] = useState(null);

  // Base de datos COMPLETA de clientes desde tu SQL
  const availableClients = useMemo(() => [
    { id: '1', name: 'MARTHA TABARES', phone: '3453053', email: 'mt@gmail.com', classification: '4', address: 'PARQUE local 123' },
    { id: '2', name: 'MARTHA BLANCO', phone: '3001234555', email: 'mb@gmail.com', classification: '3', address: 'SÁBANA' },
    { id: '3', name: 'HECTOR HERMANO DE ADRIAN', phone: '34399393', email: 'hm@gmail.com', classification: '5', address: 'SABANA' },
    { id: '4', name: 'ADRIAN', phone: '3115793179', email: '', classification: '3', address: 'Sábana local' },
    { id: '5', name: 'YANET GONZÁLEZ', phone: '3132548549', email: '', classification: '3', address: 'Sábana' },
    { id: '6', name: 'WENDY', phone: '3105675464', email: '', classification: '3', address: 'Ferrocarril' },
    { id: '7', name: 'ALFONSO SALINAS', phone: '', email: '', classification: '3', address: 'Sabana local' },
    { id: '8', name: 'JAVIER BUITRAGO', phone: '3114411220', email: '', classification: '3', address: 'Ferrocaril A003' },
    { id: '9', name: 'LORENA CASTAÑEDA', phone: '3214058023', email: '', classification: '4', address: 'Sabana' },
    { id: '10', name: 'LIBEY SALINAS', phone: '3007079647', email: '', classification: '3', address: 'Ferrocaril' },
    { id: '11', name: 'MARIELA', phone: '300', email: '', classification: '3', address: 'Ferrocaril' },
    { id: '12', name: 'RAUL ZIPA', phone: '31', email: 'worwiz', classification: '3', address: 'Parque' },
    { id: '13', name: 'RAMIRO', phone: '3125250038', email: '', classification: '3', address: 'Ferrocarril' },
    { id: '14', name: 'FERNEY SALINAS', phone: '3123484686', email: '', classification: '3', address: 'Ferrocaril' },
    { id: '15', name: 'ELEMETRIO', phone: '', email: '', classification: '4', address: 'Parque' },
    { id: '16', name: 'CARMENSA', phone: '3224153032', email: '', classification: '3', address: 'Ferrocarril' },
    { id: '17', name: 'ARNOL DIAZ PENAGOS', phone: '+57 3142418173', email: '', classification: '3', address: 'SABANA' },
    { id: '18', name: 'CRISTIAN SOLER', phone: '+57 3214045628', email: '', classification: '3', address: 'PARQUE' },
    { id: '19', name: 'DIEGO Y MAYERLY', phone: '+573112276339', email: '', classification: '3', address: 'SABANA' },
    { id: '20', name: 'DIEGO MONO', phone: '3126607756', email: '', classification: '1', address: 'FERROCARRIL' },
    { id: '21', name: 'DORIS', phone: '', email: '', classification: '1', address: 'PARQUE' },
    { id: '22', name: 'ESTEBAN ARTOS', phone: '', email: '', classification: '4', address: 'PARQUE' },
    { id: '23', name: 'FERNANDO FERROCARRIL', phone: '', email: '', classification: '2', address: 'FERROCARRIL' },
    { id: '24', name: 'FRANK BAEZ', phone: '+57 3166470853', email: '', classification: '2', address: 'PARQUE' },
    { id: '25', name: 'FREDY ORLANDO', phone: '3103386651', email: '', classification: '2', address: 'SABANA' },
    { id: '26', name: 'HECTOR COSTENO', phone: '3215762269', email: '', classification: '3', address: 'PARQUE' },
    { id: '27', name: 'HENRY SANDOBAL', phone: '', email: '', classification: '4', address: 'PARQUE' },
    { id: '28', name: 'JESUS', phone: '3196887331', email: '', classification: '3', address: 'SABANA' },
    { id: '29', name: 'JHON CRUZ', phone: '', email: '', classification: '3', address: 'SABANA' },
    { id: '30', name: 'JUAN CARLOS PLAZA', phone: '', email: '', classification: '2', address: 'PARQUE' },
    { id: '31', name: 'KELLY HERMANA DE ADRIAN', phone: '', email: '', classification: '3', address: 'Ferrocarril' },
    { id: '32', name: 'LUCERO', phone: '', email: '', classification: '3', address: 'Parque' },
    { id: '33', name: 'LUCHO', phone: '', email: '', classification: '4', address: 'Ferrocarril' },
    { id: '34', name: 'LUZ HELENA', phone: '', email: '', classification: '2', address: 'Parque' },
    { id: '35', name: 'MARCELA Y DIEGO', phone: '', email: '', classification: '2', address: 'Parque' },
    { id: '36', name: 'NEIDY', phone: '', email: '', classification: '3', address: 'Sabana' },
    { id: '37', name: 'NORVEY', phone: '', email: '', classification: '3', address: 'Parque local' },
    { id: '38', name: 'PAOLA LOPEZ', phone: '', email: '', classification: '1', address: 'Ferrocarril' },
    { id: '39', name: 'SARA', phone: '', email: '', classification: '4', address: 'SABANA' },
    { id: '40', name: 'TILSIA', phone: '', email: '', classification: '1', address: 'SABANA' },
    { id: '41', name: 'WILLIAN LOPEZ', phone: '', email: '', classification: '3', address: 'Parque' },
    { id: '42', name: 'FABIAN SOLER', phone: '3008647449', email: '', classification: '3', address: 'Parque L int 4 104' },
    { id: '43', name: 'GLADIZ LOPEZ', phone: '', email: '', classification: '3', address: 'SABANA' },
    { id: '44', name: 'JORGE', phone: '', email: '', classification: '3', address: 'Parque' },
    { id: '45', name: 'DANIEL GONZALEZ', phone: '', email: '', classification: '3', address: 'Sabana' },
    { id: '46', name: 'EDISON -laura', phone: '', email: '', classification: '3', address: 'Parque' },
    { id: '47', name: 'NATHALY', phone: '', email: '', classification: '3', address: 'Parque' },
    { id: '48', name: 'CECY', phone: '', email: '', classification: '3', address: 'Parque' },
    { id: '49', name: 'EDWIN SOLER', phone: '', email: '', classification: '4', address: 'Parque' },
    { id: '50', name: 'ROBINSON NEW YORK', phone: '3204966508', email: '', classification: '3', address: 'CC FERROCARRIL' },
    { id: '51', name: 'Nelly González', phone: '', email: '', classification: '4', address: 'SABANA' },
    { id: '52', name: 'LEIDY PAOLA TORRES', phone: '3043945256', email: '', classification: '3', address: 'Sabana' },
    { id: '53', name: 'NANCY LOPEZ', phone: '', email: '', classification: '3', address: 'PARQUE' },
    { id: '54', name: 'HERIBERTO', phone: '', email: '', classification: '3', address: 'CENTRO CARACAS' },
    { id: '55', name: 'FLOR CELIS', phone: '', email: '', classification: '3', address: 'PARQUE' },
    { id: '56', name: 'RAFA', phone: '', email: '', classification: '3', address: 'FERROCARRIL' },
    { id: '57', name: 'PEDRO MANDRIVA', phone: '', email: '', classification: '3', address: 'SABANA' },
    { id: '58', name: 'ROSENDO', phone: '', email: '', classification: '3', address: 'PARQUE' },
    { id: '59', name: 'MARCELA CRISTIAN', phone: '', email: '', classification: '2', address: 'PARQUE' },
    { id: '60', name: 'ALEJANDRA LADY', phone: '', email: '', classification: '4', address: 'PARQUE' },
    { id: '61', name: 'LEIDY YORWIS', phone: '', email: '', classification: '3', address: 'PARQUE' },
    { id: '62', name: 'JHON SALINAS', phone: '', email: '', classification: '3', address: 'SABANA' },
    { id: '63', name: 'MARCOS', phone: '', email: '', classification: '5', address: 'parque' },
    { id: '64', name: 'LUZ', phone: '', email: '', classification: '4', address: 'parque' },
    { id: '65', name: 'magdalena', phone: '', email: '', classification: '3', address: 'parque' },
    { id: '66', name: 'ANDREA DIAZ', phone: '', email: '', classification: '3', address: 'PARQUE' },
    { id: '67', name: 'JUAN PABLO', phone: '', email: '', classification: '5', address: 'Ferrocarril' }
  ], []);

  // Función para obtener el nombre de la clasificación
  const getClassificationName = (classification) => {
    const classifications = {
      '1': 'Premium',
      '2': 'Oro',
      '3': 'Plata',
      '4': 'Bronce',
      '5': 'Básico'
    };
    return classifications[classification] || 'Sin clasificación';
  };

  // Datos iniciales VACÍOS para 120 locales
  const initialClients = Array(120).fill('');

  // Cargar datos desde localStorage o usar los iniciales
  const [clients, setClients] = useState(() => {
    const savedClients = localStorage.getItem('mallClients');
    return savedClients ? JSON.parse(savedClients) : initialClients;
  });

  // Cargar clientes asignados desde localStorage
  const [assignedClients, setAssignedClients] = useState(() => {
    const saved = localStorage.getItem('assignedClients');
    return saved ? JSON.parse(saved) : {};
  });

  // Guardar en localStorage cuando cambien los datos
  useEffect(() => {
    localStorage.setItem('mallClients', JSON.stringify(clients));
    localStorage.setItem('assignedClients', JSON.stringify(assignedClients));
  }, [clients, assignedClients]);

  // Estado para la aplicación
  const [selectedLocal, setSelectedLocal] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewFilter, setViewFilter] = useState('all');
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [zoneFilter, setZoneFilter] = useState('all');

  // Función para determinar el tipo de local
  const getLocalType = (localNumber) => {
    if (localNumber <= 40) return 'sabana';
    if (localNumber <= 80) return 'plaza';
    return 'ferrocarril';
  };

  // Función para obtener el nombre completo del tipo
  const getLocalTypeName = (type) => {
    const typeNames = {
      'sabana': 'Sabana',
      'plaza': 'Plaza', 
      'ferrocarril': 'Ferrocarril'
    };
    return typeNames[type] || type;
  };

  // Generar datos de locales (120 locales)
  const locals = useMemo(() => {
    return Array.from({ length: 120 }, (_, i) => {
      const localNumber = i + 1;
      const isOccupied = clients[localNumber - 1] && clients[localNumber - 1].trim() !== '';
      const clientData = assignedClients[localNumber];
      const localType = getLocalType(localNumber);
      
      return {
        id: localNumber,
        number: localNumber,
        isOccupied,
        clientName: isOccupied ? clients[localNumber - 1] : null,
        clientData: clientData || null,
        area: (Math.floor(Math.random() * 8) + 8) * 10,
        phone: clientData?.phone || 'N/A',
        type: localType,
        typeName: getLocalTypeName(localType)
      };
    });
  }, [clients, assignedClients]);

  // Filtrar locales por zona y estado
  const filteredLocals = useMemo(() => {
    return locals.filter(local => {
      if (zoneFilter !== 'all' && local.type !== zoneFilter) return false;
      if (viewFilter === 'available' && local.isOccupied) return false;
      if (viewFilter === 'occupied' && !local.isOccupied) return false;
      if (searchTerm && local.isOccupied) {
        return local.clientName.toLowerCase().includes(searchTerm.toLowerCase());
      }
      return true;
    });
  }, [locals, searchTerm, viewFilter, zoneFilter]);

  // Filtrar clientes disponibles (SOLO los no asignados)
  const filteredAvailableClients = useMemo(() => {
    const assignedClientIds = new Set(
      Object.values(assignedClients)
        .filter(client => client && client.id)
        .map(client => client.id)
    );
    
    const unassignedClients = availableClients.filter(client => 
      !assignedClientIds.has(client.id)
    );

    return unassignedClients.filter(client => 
      client.name.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
      client.address.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
      getClassificationName(client.classification).toLowerCase().includes(clientSearchTerm.toLowerCase())
    );
  }, [clientSearchTerm, assignedClients, availableClients]);

  // Obtener clientes no asignados
  const unassignedClients = useMemo(() => {
    const assignedClientIds = new Set(
      Object.values(assignedClients)
        .filter(client => client && client.id)
        .map(client => client.id)
    );
    
    return availableClients.filter(client => 
      !assignedClientIds.has(client.id)
    );
  }, [assignedClients, availableClients]);

  // Manejar cambio de zona
  const handleZoneChange = (zone) => {
    setZoneFilter(zone);
    setViewFilter('all');
    setSearchTerm('');
  };

  // Mostrar todos los locales
  const handleShowAll = () => {
    setZoneFilter('all');
  };

  // Manejar la selección de un local
  const handleSelectLocal = (local) => {
    setSelectedLocal(local);
  };

  // Iniciar edición de un local
  const handleEditLocal = (local, e) => {
    if (e) e.stopPropagation();
    setEditLocal(local);
    setNewClientName(local.isOccupied ? local.clientName : '');
    setIsEditing(true);
    setShowClientTable(true);
    setSelectedClientFromTable(null);
  };

  // Seleccionar cliente desde la tabla
  const handleSelectClientFromTable = (client) => {
    setSelectedClientFromTable(client);
    setNewClientName(client.name);
  };

  // Asignar cliente seleccionado al local
  const handleAssignClient = () => {
    if (!editLocal || !selectedClientFromTable) {
      alert('Por favor selecciona un cliente de la tabla');
      return;
    }

    const updatedClients = [...clients];
    // Asegurar que el array tenga 120 elementos
    while (updatedClients.length < 120) {
      updatedClients.push('');
    }
    
    // Actualizar nombre del cliente
    updatedClients[editLocal.number - 1] = selectedClientFromTable.name;
    
    // Actualizar datos completos del cliente
    const updatedAssignedClients = {
      ...assignedClients,
      [editLocal.number]: selectedClientFromTable
    };

    setClients(updatedClients);
    setAssignedClients(updatedAssignedClients);
    
    // Actualizar local seleccionado si es el mismo
    if (selectedLocal && selectedLocal.number === editLocal.number) {
      setSelectedLocal({
        ...selectedLocal,
        isOccupied: true,
        clientName: selectedClientFromTable.name,
        clientData: selectedClientFromTable
      });
    }
    
    // Limpiar estado de edición
    setIsEditing(false);
    setEditLocal(null);
    setNewClientName('');
    setSelectedClientFromTable(null);
    setShowClientTable(false);
  };

  // Guardar cambios en un local (método manual)
  const handleSaveEdit = () => {
    if (!editLocal) return;

    const updatedClients = [...clients];
    // Asegurar que el array tenga 120 elementos
    while (updatedClients.length < 120) {
      updatedClients.push('');
    }
    
    if (newClientName.trim() === '') {
      // Liberar el local
      updatedClients[editLocal.number - 1] = '';
      const updatedAssignedClients = { ...assignedClients };
      delete updatedAssignedClients[editLocal.number];
      setAssignedClients(updatedAssignedClients);
      
      // Actualizar local seleccionado si es el mismo
      if (selectedLocal && selectedLocal.number === editLocal.number) {
        setSelectedLocal({
          ...selectedLocal,
          isOccupied: false,
          clientName: null,
          clientData: null
        });
      }
    } else {
      // Asignar nuevo cliente
      updatedClients[editLocal.number - 1] = newClientName;
      
      // Buscar si el cliente existe en la base de datos
      const clientFromDb = availableClients.find(
        client => client.name.toLowerCase() === newClientName.toLowerCase()
      );
      
      if (clientFromDb) {
        const updatedAssignedClients = {
          ...assignedClients,
          [editLocal.number]: clientFromDb
        };
        setAssignedClients(updatedAssignedClients);
        
        // Actualizar local seleccionado si es el mismo
        if (selectedLocal && selectedLocal.number === editLocal.number) {
          setSelectedLocal({
            ...selectedLocal,
            isOccupied: true,
            clientName: newClientName,
            clientData: clientFromDb
          });
        }
      }
    }

    setClients(updatedClients);
    setIsEditing(false);
    setEditLocal(null);
    setNewClientName('');
    setShowClientTable(false);
    setSelectedClientFromTable(null);
  };

  // Cancelar edición
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditLocal(null);
    setNewClientName('');
    setShowClientTable(false);
    setSelectedClientFromTable(null);
  };

  // Liberar un local (quitar cliente)
  const handleReleaseLocal = (localNumber, e) => {
    if (e) e.stopPropagation();
    
    const updatedClients = [...clients];
    // Asegurar que el array tenga 120 elementos
    while (updatedClients.length < 120) {
      updatedClients.push('');
    }
    updatedClients[localNumber - 1] = '';
    
    const updatedAssignedClients = { ...assignedClients };
    delete updatedAssignedClients[localNumber];
    
    setClients(updatedClients);
    setAssignedClients(updatedAssignedClients);
    
    // Actualizar local seleccionado si es el mismo
    if (selectedLocal && selectedLocal.number === localNumber) {
      setSelectedLocal({
        ...selectedLocal,
        isOccupied: false,
        clientName: null,
        clientData: null
      });
    }
  };

  // Toggle modo edición
  const handleToggleEditMode = () => {
    if (isEditing) {
      // Si estamos desactivando el modo edición, limpiar estados relacionados
      handleCancelEdit();
    } else {
      setIsEditing(true);
    }
  };

  // Restablecer a datos iniciales
  const handleResetData = () => {
    if (window.confirm('¿Estás seguro de que quieres restablecer todos los datos? Se perderán los cambios.')) {
      setClients(initialClients);
      setAssignedClients({});
      setZoneFilter('all');
      setSelectedLocal(null);
    }
  };

  // Estadísticas por zona
  const zoneStats = useMemo(() => {
    const sabanaLocals = locals.filter(local => local.type === 'sabana');
    const plazaLocals = locals.filter(local => local.type === 'plaza');
    const ferrocarrilLocals = locals.filter(local => local.type === 'ferrocarril');

    return {
      sabana: {
        total: sabanaLocals.length,
        occupied: sabanaLocals.filter(local => local.isOccupied).length,
        available: sabanaLocals.filter(local => !local.isOccupied).length
      },
      plaza: {
        total: plazaLocals.length,
        occupied: plazaLocals.filter(local => local.isOccupied).length,
        available: plazaLocals.filter(local => !local.isOccupied).length
      },
      ferrocarril: {
        total: ferrocarrilLocals.length,
        occupied: ferrocarrilLocals.filter(local => local.isOccupied).length,
        available: ferrocarrilLocals.filter(local => !local.isOccupied).length
      }
    };
  }, [locals]);

  // Estadísticas generales
  const stats = useMemo(() => {
    const occupied = locals.filter(local => local.isOccupied).length;
    const available = 120 - occupied;
    return { occupied, available };
  }, [locals]);

  // Renderizar el mapa con diseño de 120 locales organizados por zonas
  const renderMapGrid = () => {
    return (
      <div className="mall-layout-large">
        {/* Botones de filtro por zona mejorados */}
        <div className="zones-controls">
          <div className="filter-section">
            <span className="filter-label">Filtrar por zona:</span>
            <div className="zones-container">
              <button 
                className={`zone-btn ${zoneFilter === 'ferrocarril' ? 'active' : ''}`}
                onClick={() => handleZoneChange('ferrocarril')}
              >
                Zona Ferrocarril
              </button>
              <button 
                className={`zone-btn ${zoneFilter === 'sabana' ? 'active' : ''}`}
                onClick={() => handleZoneChange('sabana')}
              >
                Zona Sabana
              </button>
              <button 
                className={`zone-btn ${zoneFilter === 'plaza' ? 'active' : ''}`}
                onClick={() => handleZoneChange('plaza')}
              >
                Zona Plaza
              </button>
            </div>
          </div>
          <button 
            className={`show-all-btn ${zoneFilter === 'all' ? 'active' : ''}`}
            onClick={handleShowAll}
          >
            Mostrar todas las zonas
          </button>
        </div>

        {/* Indicador de filtro activo */}
        {zoneFilter !== 'all' && (
          <div className="active-filter-indicator">
            <span>Mostrando: <strong>{getLocalTypeName(zoneFilter)}</strong> ({filteredLocals.length} locales)</span>
            <button 
              onClick={handleShowAll}
              className="clear-filter-btn"
            >
              ✕ Mostrar todas las zonas
            </button>
          </div>
        )}

        {/* CONTENIDO DE LOCALES */}
        <div className="locals-grid-container">
          {filteredLocals.length > 0 ? (
            <div className="locals-grid">
              {filteredLocals.map(local => (
                <div
                  key={local.id}
                  className={`local-square ${local.isOccupied ? 'occupied' : 'available'} ${local.type} ${
                    selectedLocal?.id === local.id ? 'selected' : ''
                  }`}
                  onClick={() => handleSelectLocal(local)}
                  title={`Local ${local.number} - ${local.typeName}${local.isOccupied ? ` - ${local.clientName}` : ' - Disponible'}`}
                >
                  <div className="local-num">L-{local.number}</div>
                  <div className="local-client">
                    {local.isOccupied ? (
                      <span className="client-name-short">
                        {local.clientName.length > 8 ? local.clientName.substring(0, 8) + '...' : local.clientName}
                      </span>
                    ) : (
                      'Disp.'
                    )}
                  </div>
                  {local.clientData && (
                    <div className="client-classification">
                      {getClassificationName(local.clientData.classification)}
                    </div>
                  )}
                  {isEditing && (
                    <div className="local-overlay-actions">
                      <button 
                        className="edit-overlay-btn"
                        onClick={(e) => handleEditLocal(local, e)}
                        title="Editar local"
                      >
                        ✏️
                      </button>
                      {local.isOccupied && (
                        <button 
                          className="release-overlay-btn"
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
          ) : (
            <div className="empty-state">
              <h3>No hay locales disponibles</h3>
              <p>No se encontraron locales en esta zona con los filtros actuales.</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Renderizar lista de locales mejorada
  const renderLocalsList = () => {
    return (
      <div className="locals-list-improved">
        <h2>
          Locales {zoneFilter !== 'all' ? `de ${getLocalTypeName(zoneFilter)}` : 'de Todas las Zonas'} 
          {isEditing && <span className="editing-badge">(Edición)</span>}
        </h2>
        
        <div className="locals-stats-improved">
          <div className="stat-card">
            <span className="stat-number">{filteredLocals.filter(l => l.isOccupied).length}</span>
            <span className="stat-label">Ocupados</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{filteredLocals.filter(l => !l.isOccupied).length}</span>
            <span className="stat-label">Disponibles</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{unassignedClients.length}</span>
            <span className="stat-label">Clientes Libres</span>
          </div>
        </div>

        <div className="locals-container-improved">
          {filteredLocals.length > 0 ? (
            filteredLocals.map(local => (
              <div
                key={local.id}
                className={`local-item-improved ${selectedLocal?.id === local.id ? 'selected' : ''} ${local.type}`}
                onClick={() => handleSelectLocal(local)}
              >
                <div className="local-header-improved">
                  <span className="local-number-improved">Local {local.number}</span>
                  <span className="local-zone-improved">{local.typeName}</span>
                  {local.clientData && (
                    <span className="client-classification-badge-improved">
                      {getClassificationName(local.clientData.classification)}
                    </span>
                  )}
                </div>
                <div className="local-body-improved">
                  <span className="client-name-improved">
                    {local.isOccupied ? local.clientName : 'Disponible'}
                  </span>
                </div>
                {isEditing && (
                  <div className="local-actions-improved">
                    <button 
                      className="edit-btn-improved"
                      onClick={(e) => handleEditLocal(local, e)}
                      title="Editar local"
                    >
                      ✏️
                    </button>
                    {local.isOccupied && (
                      <button 
                        className="release-btn-improved"
                        onClick={(e) => handleReleaseLocal(local.number, e)}
                        title="Liberar local"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="empty-state-list">
              <h3>No se encontraron locales</h3>
              <p>Intenta con otros filtros o muestra todas las zonas.</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="mall-map-container">
      <header className="mall-header">
        <h1>Mapa de Locales - Centro Comercial</h1>
        <p className="mall-description">
          Total: 120 locales | Ocupados: {stats.occupied} | Disponibles: {stats.available} | 
          Clientes registrados: {availableClients.length} | Sin asignar: {unassignedClients.length}
          {isEditing && <span className="editing-notice"> 🟢 Modo edición activado</span>}
        </p>
        
        {/* Estadísticas por zona mejoradas */}
        <div className="zones-stats-improved">
          <div 
            className={`zone-stat-improved sabana ${zoneFilter === 'sabana' ? 'active' : ''}`}
            onClick={() => handleZoneChange('sabana')}
          >
            <span className="zone-name-improved">Sabana</span>
            <span className="zone-numbers-improved">
              {zoneStats.sabana.occupied}/{zoneStats.sabana.total}
            </span>
            <div className="zone-progress">
              <div 
                className="zone-progress-fill" 
                style={{width: `${(zoneStats.sabana.occupied / zoneStats.sabana.total) * 100}%`}}
              ></div>
            </div>
          </div>
          <div 
            className={`zone-stat-improved plaza ${zoneFilter === 'plaza' ? 'active' : ''}`}
            onClick={() => handleZoneChange('plaza')}
          >
            <span className="zone-name-improved">Plaza</span>
            <span className="zone-numbers-improved">
              {zoneStats.plaza.occupied}/{zoneStats.plaza.total}
            </span>
            <div className="zone-progress">
              <div 
                className="zone-progress-fill" 
                style={{width: `${(zoneStats.plaza.occupied / zoneStats.plaza.total) * 100}%`}}
              ></div>
            </div>
          </div>
          <div 
            className={`zone-stat-improved ferrocarril ${zoneFilter === 'ferrocarril' ? 'active' : ''}`}
            onClick={() => handleZoneChange('ferrocarril')}
          >
            <span className="zone-name-improved">Ferrocarril</span>
            <span className="zone-numbers-improved">
              {zoneStats.ferrocarril.occupied}/{zoneStats.ferrocarril.total}
            </span>
            <div className="zone-progress">
              <div 
                className="zone-progress-fill" 
                style={{width: `${(zoneStats.ferrocarril.occupied / zoneStats.ferrocarril.total) * 100}%`}}
              ></div>
            </div>
          </div>
        </div>
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
            Todos los estados
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
          
          {/* BOTÓN CORREGIDO: Modo Edición */}
          <button 
            className={`edit-mode-btn ${isEditing ? 'editing-active' : ''}`}
            onClick={handleToggleEditMode}
          >
            {isEditing ? '🟢 Cancelar Edición' : '⚪ Modo Edición'}
          </button>
          
          <button 
            onClick={() => setShowClientTable(!showClientTable)}
            className="clients-btn"
          >
            👥 Clientes ({unassignedClients.length})
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
      
      <div className="mall-main-content-improved">
        {/* LISTA DE LOCALES MEJORADA */}
        {renderLocalsList()}
        
        {/* MAPA DE LOCALES */}
        <div className="map-container-improved">
          {renderMapGrid()}
          
          <div className="map-legend-improved">
            <h4>Leyenda</h4>
            <div className="legend-grid">
              <div className="legend-item-improved">
                <div className="legend-color available"></div>
                <span>Disponible</span>
              </div>
              <div className="legend-item-improved">
                <div className="legend-color occupied"></div>
                <span>Ocupado</span>
              </div>
              <div className="legend-item-improved">
                <div className="legend-color selected"></div>
                <span>Seleccionado</span>
              </div>
              <div className="legend-item-improved">
                <div className="legend-color sabana"></div>
                <span>Sabana</span>
              </div>
              <div className="legend-item-improved">
                <div className="legend-color plaza"></div>
                <span>Plaza</span>
              </div>
              <div className="legend-item-improved">
                <div className="legend-color ferrocarril"></div>
                <span>Ferrocarril</span>
              </div>
            </div>
          </div>
          
          <div className="local-details-improved">
            <h3>Información del Local {selectedLocal && `- L-${selectedLocal.number}`}</h3>
            {selectedLocal ? (
              <>
                <div className="detail-item-improved">
                  <span className="detail-label-improved">Número:</span>
                  <span>L-{selectedLocal.number}</span>
                </div>
                <div className="detail-item-improved">
                  <span className="detail-label-improved">Zona:</span>
                  <span className={`zone-badge-improved ${selectedLocal.type}`}>
                    {selectedLocal.typeName}
                  </span>
                </div>
                <div className="detail-item-improved">
                  <span className="detail-label-improved">Estado:</span>
                  <span>{selectedLocal.isOccupied ? 'Ocupado' : 'Disponible'}</span>
                </div>
                <div className="detail-item-improved">
                  <span className="detail-label-improved">Cliente:</span>
                  <span>{selectedLocal.isOccupied ? selectedLocal.clientName : 'Por asignar'}</span>
                </div>
                {selectedLocal.clientData && (
                  <>
                    <div className="detail-item-improved">
                      <span className="detail-label-improved">Dirección:</span>
                      <span>{selectedLocal.clientData.address}</span>
                    </div>
                    <div className="detail-item-improved">
                      <span className="detail-label-improved">Clasificación:</span>
                      <span className={`classification-badge-improved ${selectedLocal.clientData.classification}`}>
                        {getClassificationName(selectedLocal.clientData.classification)}
                      </span>
                    </div>
                    <div className="detail-item-improved">
                      <span className="detail-label-improved">Teléfono:</span>
                      <span>{selectedLocal.clientData.phone || 'No registrado'}</span>
                    </div>
                    <div className="detail-item-improved">
                      <span className="detail-label-improved">Email:</span>
                      <span>{selectedLocal.clientData.email || 'No registrado'}</span>
                    </div>
                  </>
                )}
                <div className="detail-item-improved">
                  <span className="detail-label-improved">Área:</span>
                  <span>{selectedLocal.area} m²</span>
                </div>
                {isEditing && (
                  <div className="edit-actions-improved">
                    <button 
                      className="edit-btn-improved"
                      onClick={(e) => handleEditLocal(selectedLocal, e)}
                    >
                      ✏️ {selectedLocal.isOccupied ? 'Cambiar Cliente' : 'Asignar Cliente'}
                    </button>
                    {selectedLocal.isOccupied && (
                      <button 
                        className="release-btn-improved"
                        onClick={(e) => handleReleaseLocal(selectedLocal.number, e)}
                      >
                        🗑️ Liberar local
                      </button>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="no-selection-improved">
                <p>Selecciona un local para ver sus detalles</p>
                {isEditing && (
                  <p className="editing-hint">🟢 Modo edición activado - Haz clic en cualquier local para editarlo</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de edición con tabla de clientes - CORREGIDO */}
      {isEditing && editLocal && (
        <div className="modal-overlay active">
          <div className="modal-content large-modal">
            <div className="modal-header">
              <h3>Asignar Cliente al Local {editLocal.number} - {editLocal.typeName}</h3>
              <button onClick={handleCancelEdit} className="close-modal-btn">×</button>
            </div>
            
            <div className="client-selection-section">
              <div className="form-group">
                <label htmlFor="clientName">Nombre del Cliente:</label>
                <input
                  type="text"
                  id="clientName"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  placeholder="Escribe el nombre o selecciona de la tabla"
                  autoFocus
                />
              </div>

              <div className="clients-table-section">
                <h4>Clientes Disponibles ({filteredAvailableClients.length})</h4>
                <div className="client-search">
                  <input
                    type="text"
                    placeholder="Buscar cliente por nombre, dirección o clasificación..."
                    value={clientSearchTerm}
                    onChange={(e) => setClientSearchTerm(e.target.value)}
                  />
                </div>
                <div className="clients-table-container">
                  {filteredAvailableClients.length > 0 ? (
                    <table className="clients-table">
                      <thead>
                        <tr>
                          <th>Nombre</th>
                          <th>Dirección</th>
                          <th>Clasificación</th>
                          <th>Teléfono</th>
                          <th>Acción</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAvailableClients.map(client => (
                          <tr 
                            key={client.id}
                            className={selectedClientFromTable?.id === client.id ? 'selected' : ''}
                          >
                            <td><strong>{client.name}</strong></td>
                            <td>{client.address}</td>
                            <td>
                              <span className={`classification-tag ${client.classification}`}>
                                {getClassificationName(client.classification)}
                              </span>
                            </td>
                            <td>{client.phone || 'No registrado'}</td>
                            <td>
                              <button
                                onClick={() => handleSelectClientFromTable(client)}
                                className={`select-client-btn ${selectedClientFromTable?.id === client.id ? 'selected' : ''}`}
                              >
                                {selectedClientFromTable?.id === client.id ? '✓ Seleccionado' : 'Seleccionar'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="no-clients-message">
                      <p>No se encontraron clientes disponibles con los criterios de búsqueda.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="modal-actions">
              {selectedClientFromTable ? (
                <button onClick={handleAssignClient} className="save-btn primary">
                  💾 Asignar {selectedClientFromTable.name}
                </button>
              ) : newClientName.trim() ? (
                <button onClick={handleSaveEdit} className="save-btn">
                  💾 Guardar Manualmente
                </button>
              ) : (
                <button onClick={handleSaveEdit} className="save-btn secondary">
                  🗑️ Liberar Local
                </button>
              )}
              <button onClick={handleCancelEdit} className="cancel-btn">
                ❌ Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Panel de tabla de clientes independiente */}
      {showClientTable && !isEditing && (
        <div className="clients-panel">
          <div className="clients-panel-header">
            <h3>Base de Datos de Clientes ({availableClients.length} registros)</h3>
            <button 
              onClick={() => setShowClientTable(false)}
              className="close-panel-btn"
            >
              ×
            </button>
          </div>
          <div className="client-search">
            <input
              type="text"
              placeholder="Buscar cliente por nombre, dirección o clasificación..."
              value={clientSearchTerm}
              onChange={(e) => setClientSearchTerm(e.target.value)}
            />
          </div>
          <div className="clients-table-container">
            <table className="clients-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Dirección</th>
                  <th>Clasificación</th>
                  <th>Teléfono</th>
                  <th>Email</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {filteredAvailableClients.map(client => {
                  const isAssigned = Object.values(assignedClients).some(
                    assigned => assigned && assigned.id === client.id
                  );
                  return (
                    <tr key={client.id} className={isAssigned ? 'assigned' : 'available'}>
                      <td><strong>{client.name}</strong></td>
                      <td>{client.address}</td>
                      <td>
                        <span className={`classification-tag ${client.classification}`}>
                          {getClassificationName(client.classification)}
                        </span>
                      </td>
                      <td>{client.phone || 'No registrado'}</td>
                      <td>{client.email || 'No registrado'}</td>
                      <td>
                        <span className={`status-badge ${isAssigned ? 'assigned' : 'available'}`}>
                          {isAssigned ? 'Asignado' : 'Disponible'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      <footer className="mall-footer">
        <p>Centro Comercial - Sistema de Gestión de Locales © 2025</p>
      </footer>
    </div>
  );
};

export default MallMap;