import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

const resources = {
  en: { translation: {
    appName: 'Doti', welcome: 'Your simple space for everyday things.',
    navigation: { tasks: 'Tasks', birthdays: 'Birthdays', notes: 'Notes', completed: 'Completed', settings: 'Settings' },
    placeholder: 'This screen is ready for the next phase.',
    tasks: { today: 'Today', later: 'Later', add: 'Add task', quickAdd: 'What needs doing?', upcomingBirthdays: 'Upcoming birthdays' },
    taskDetail: { backToTasks: 'Back to Tasks', loading: 'Loading...', notFound: 'Task not found', status: 'Status', priority: 'Priority', created: 'Created', due: 'Due', completed: 'Completed', description: 'Description', edit: 'Edit', preview: 'Preview', addDescription: 'Add a description...', delete: 'Delete Task', confirmDelete: 'Delete this task? This cannot be undone from the current UI.', cancel: 'Cancel', complete: 'Complete task', restore: 'Restore task', changePriority: 'Change priority', hasDescription: 'Has description', priorityGreen: 'Green priority', priorityYellow: 'Yellow priority', priorityOrange: 'Orange priority', priorityRed: 'Red priority' },
    settings: { title: 'Settings', language: 'Language', theme: 'Theme', light: 'Light', dark: 'Dark', english: 'English', spanish: 'Spanish' },
  } },
  es: { translation: {
    appName: 'Doti', welcome: 'Tu espacio simple para las cosas de todos los días.',
    navigation: { tasks: 'Tareas', birthdays: 'Cumpleaños', notes: 'Notas', completed: 'Completadas', settings: 'Configuración' },
    placeholder: 'Esta pantalla está lista para la próxima fase.',
    tasks: { today: 'Hoy', later: 'Más tarde', add: 'Agregar tarea', quickAdd: '¿Qué hay que hacer?', upcomingBirthdays: 'Próximos cumpleaños' },
    taskDetail: { backToTasks: 'Volver a tareas', loading: 'Cargando...', notFound: 'Tarea no encontrada', status: 'Estado', priority: 'Prioridad', created: 'Creada', due: 'Vencimiento', completed: 'Completada', description: 'Descripción', edit: 'Editar', preview: 'Vista previa', addDescription: 'Agregar una descripción...', delete: 'Eliminar tarea', confirmDelete: '¿Eliminar esta tarea? Esta acción no se puede deshacer desde la interfaz actual.', cancel: 'Cancelar', complete: 'Completar tarea', restore: 'Restaurar tarea', changePriority: 'Cambiar prioridad', hasDescription: 'Tiene descripción', priorityGreen: 'Prioridad verde', priorityYellow: 'Prioridad amarilla', priorityOrange: 'Prioridad naranja', priorityRed: 'Prioridad roja' },
    settings: { title: 'Configuración', language: 'Idioma', theme: 'Tema', light: 'Claro', dark: 'Oscuro', english: 'Inglés', spanish: 'Español' },
  } },
}

void i18n.use(initReactI18next).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

export default i18n
