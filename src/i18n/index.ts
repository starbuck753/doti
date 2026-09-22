import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

const resources = {
  en: { translation: {
    appName: 'Doti', welcome: 'Your simple space for everyday things.',
    navigation: { tasks: 'Tasks', birthdays: 'Birthdays', notes: 'Notes', completed: 'Completed', settings: 'Settings' },
    placeholder: 'This screen is ready for the next phase.',
    tasks: { today: 'Today', later: 'Later', add: 'Add task', quickAdd: 'What needs doing?', upcomingBirthdays: 'Upcoming birthdays', more: 'More actions' },
    taskDetail: { backToTasks: 'Back to Tasks', loading: 'Loading...', notFound: 'Task not found', status: 'Status', priority: 'Priority', created: 'Created', due: 'Due', completed: 'Completed', description: 'Description', edit: 'Edit', preview: 'Preview', addDescription: 'Add a description...', delete: 'Delete Task', confirmDelete: 'Delete this task? This cannot be undone from the current UI.', cancel: 'Cancel', complete: 'Complete task', restore: 'Restore task', changePriority: 'Change priority', hasDescription: 'Has description', priorityGreen: 'Green priority', priorityYellow: 'Yellow priority', priorityOrange: 'Orange priority', priorityRed: 'Red priority' },
    birthdays: { today: 'Today', tomorrow: 'Tomorrow', days: '{{count}} days', addTitle: 'Add Birthday', editTitle: 'Edit Birthday', name: 'Name', month: 'Month', day: 'Day', add: 'Add', save: 'Save', cancel: 'Cancel', delete: 'Delete Birthday', confirmDelete: 'Delete this birthday?', empty: 'No birthdays yet', seeAll: 'See all', nameRequired: 'Enter a name.', invalidDay: 'Enter a valid day.' },
    notes: { search: 'Search notes...', addTitle: 'Add note', untitled: 'Untitled', updated: 'Updated', updatedToday: 'Updated today', empty: 'No notes yet', noResults: 'No notes found', loading: 'Loading...', startWriting: 'Start writing...', backToNotes: 'Back to Notes', notFound: 'Note not found', delete: 'Delete Note', confirmDelete: 'Delete this note? This cannot be undone from the current UI.' },
    links: { linkedNotes: 'Linked Notes', linkedTasks: 'Linked Tasks', linkNote: 'Link a note', linkTask: 'Link a task', searchNotes: 'Search notes...', searchTasks: 'Search tasks...', createNote: 'Create new note', createTask: 'Create new task', noLinkedNotes: 'No linked notes', noLinkedTasks: 'No linked tasks', noNotesAvailable: 'No notes available', noTasksAvailable: 'No tasks available', unlink: 'Unlink', taskTitle: 'Task title', create: 'Create', cancel: 'Cancel' },
    completed: { title: 'Completed Tasks', today: 'Today', yesterday: 'Yesterday', completed: 'Completed', restore: 'Restore', empty: 'No completed tasks yet' },
    settings: { title: 'Settings', appearance: 'Appearance', tasks: 'Tasks', about: 'About', language: 'Language', theme: 'Theme', system: 'System', light: 'Light', dark: 'Dark', english: 'English', spanish: 'Spanish', accentColor: 'Accent Color', priorityAging: 'Priority Aging', priorityAgingHelp: 'Automatically increases the priority of tasks that remain pending. Changing a task’s priority manually restarts its aging period.', agingInterval: 'Aging Interval', days: '{{count}} days', version: 'Version', colors: { blue: 'Blue', purple: 'Purple', pink: 'Pink', green: 'Green', orange: 'Orange', teal: 'Teal' } },
  } },
  es: { translation: {
    appName: 'Doti', welcome: 'Tu espacio simple para las cosas de todos los días.',
    navigation: { tasks: 'Tareas', birthdays: 'Cumpleaños', notes: 'Notas', completed: 'Completadas', settings: 'Configuración' },
    placeholder: 'Esta pantalla está lista para la próxima fase.',
    tasks: { today: 'Hoy', later: 'Más tarde', add: 'Agregar tarea', quickAdd: '¿Qué hay que hacer?', upcomingBirthdays: 'Próximos cumpleaños', more: 'Más acciones' },
    taskDetail: { backToTasks: 'Volver a tareas', loading: 'Cargando...', notFound: 'Tarea no encontrada', status: 'Estado', priority: 'Prioridad', created: 'Creada', due: 'Vencimiento', completed: 'Completada', description: 'Descripción', edit: 'Editar', preview: 'Vista previa', addDescription: 'Agregar una descripción...', delete: 'Eliminar tarea', confirmDelete: '¿Eliminar esta tarea? Esta acción no se puede deshacer desde la interfaz actual.', cancel: 'Cancelar', complete: 'Completar tarea', restore: 'Restaurar tarea', changePriority: 'Cambiar prioridad', hasDescription: 'Tiene descripción', priorityGreen: 'Prioridad verde', priorityYellow: 'Prioridad amarilla', priorityOrange: 'Prioridad naranja', priorityRed: 'Prioridad roja' },
    birthdays: { today: 'Hoy', tomorrow: 'Mañana', days: '{{count}} días', addTitle: 'Agregar cumpleaños', editTitle: 'Editar cumpleaños', name: 'Nombre', month: 'Mes', day: 'Día', add: 'Agregar', save: 'Guardar', cancel: 'Cancelar', delete: 'Eliminar cumpleaños', confirmDelete: '¿Eliminar este cumpleaños?', empty: 'No hay cumpleaños todavía', seeAll: 'Ver todos', nameRequired: 'Ingresa un nombre.', invalidDay: 'Ingresa un día válido.' },
    notes: { search: 'Buscar notas...', addTitle: 'Agregar nota', untitled: 'Sin título', updated: 'Actualizada', updatedToday: 'Actualizada hoy', empty: 'Aún no hay notas', noResults: 'No se encontraron notas', loading: 'Cargando...', startWriting: 'Empieza a escribir...', backToNotes: 'Volver a notas', notFound: 'Nota no encontrada', delete: 'Eliminar nota', confirmDelete: '¿Eliminar esta nota? Esta acción no se puede deshacer desde la interfaz actual.' },
    links: { linkedNotes: 'Notas vinculadas', linkedTasks: 'Tareas vinculadas', linkNote: 'Vincular una nota', linkTask: 'Vincular una tarea', searchNotes: 'Buscar notas...', searchTasks: 'Buscar tareas...', createNote: 'Crear nueva nota', createTask: 'Crear nueva tarea', noLinkedNotes: 'No hay notas vinculadas', noLinkedTasks: 'No hay tareas vinculadas', noNotesAvailable: 'No hay notas disponibles', noTasksAvailable: 'No hay tareas disponibles', unlink: 'Desvincular', taskTitle: 'Título de la tarea', create: 'Crear', cancel: 'Cancelar' },
    completed: { title: 'Tareas completadas', today: 'Hoy', yesterday: 'Ayer', completed: 'Completada', restore: 'Restaurar', empty: 'Aún no hay tareas completadas' },
    settings: { title: 'Configuración', appearance: 'Apariencia', tasks: 'Tareas', about: 'Acerca de', language: 'Idioma', theme: 'Tema', system: 'Sistema', light: 'Claro', dark: 'Oscuro', english: 'Inglés', spanish: 'Español', accentColor: 'Color de acento', priorityAging: 'Antigüedad de prioridad', priorityAgingHelp: 'Aumenta automáticamente la prioridad de las tareas que permanecen pendientes. Cambiar manualmente la prioridad reinicia su período de antigüedad.', agingInterval: 'Intervalo de antigüedad', days: '{{count}} días', version: 'Versión', colors: { blue: 'Azul', purple: 'Violeta', pink: 'Rosa', green: 'Verde', orange: 'Naranja', teal: 'Verde azulado' } },
  } },
}

void i18n.use(initReactI18next).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

export default i18n
