const { app, BrowserWindow, Menu } = require('electron');

let mainWindow;

app.on('ready', () => {
  mainWindow = new BrowserWindow({
    width: 900,  // Tamaño de la ventana
    height: 700,  // Tamaño de la ventana
    icon: 'C:\\Users\\Jere\\Downloads\\GoalBox-main\\GoalBox-main\\piggy-bank-solid.ico',  // Ruta del ícono personalizado
    webPreferences: {
      nodeIntegration: true  // Habilitar integración de Node.js
    }
  });

  mainWindow.loadFile('index.html');  // Cargar tu archivo HTML principal

  // Crear un menú personalizado para ocultar opciones no deseadas
  const menu = Menu.buildFromTemplate([
    { label: 'File', submenu: [] },
    { label: 'Edit', submenu: [] },
    { label: 'View', submenu: [] },
    { label: 'Help', submenu: [] }
  ]);
  
  Menu.setApplicationMenu(menu);  // Asignar menú personalizado

  mainWindow.on('closed', () => {
    app.quit();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
