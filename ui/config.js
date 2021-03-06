angular.module('app.config', [])
.constant('appconf', {
    //shared servive api and ui urls (for menus and stuff)
    shared_api: '/api/shared',
    shared_url: '/shared',

    //authentcation service API to refresh token, etc.
    auth_api: '/api/auth',
    auth_url: '/auth',

    sca_api: '/api/wf',

    progress_api: '/api/progress',
    progress_url: '/progress',

    jwt_id: 'jwt',
    upload_task_id: '_upload',

    breads: [
        {id: "workflows", label: "Workflows", url:"/wf/#/workflows" },
        {id: "process", label: "Freesurfer"},
        {id: "input", label: "Add Input"},
        {id: "tasks", label: "Tasks"},
    ]
});

