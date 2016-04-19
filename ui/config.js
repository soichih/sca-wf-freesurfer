angular.module('app.config', [])
.constant('appconf', {
    //api: '/api/sca-wf-freesurfer',

    //shared servive api and ui urls (for menus and stuff)
    shared_api: '/api/shared',
    shared_url: '/shared',

    //authentcation service API to refresh token, etc.
    auth_api: '/api/auth',
    auth_url: '/auth',

    sca_api: '/api/sca',
    //sca_url: '/sca',

    //upload_api: '/api/upload',

    progress_api: '/api/progress',
    progress_url: '/progress',

    jwt_id: 'jwt',
    input_task_id: '_input',

    breads: [
        //{id: "workflows", label: "Workflows", url:"/sca/#/workflows" },
        /*
        {id: "start", label: "Start", url: "#/:instid/start" },
        {id: "upload", label: "Upload / Import", url: "#/:instid/upload" },
        */
        {id: "process", label: "Freesurfer", url: "tdb" },
        {id: "input", label: "Add Input", url: "tdb" },
    ]
    /*
    menu: [
        {
            id: "start",
            label: "Start",
            url: "#/start", //TODO need to set instid..
        },
        {
            id: "upload",
            label: "Upload / Import",
            url: "#/upload", //TODO need to set instid..
         },
        {
            id: "recon",
            label: "Recon",
            url: "#/recon", //TODO need to set instid..
         },
    ]
    */
});

