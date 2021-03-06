'use strict';

app.controller('PageController', ['$scope', 'appconf', '$route', 'toaster', '$http', 'jwtHelper', 'menu', '$window', '$anchorScroll', '$routeParams',
function($scope, appconf, $route, toaster, $http, jwtHelper, menu, $window, $anchorScroll, $routeParams) {
    $scope.appconf = appconf;
    $scope.title = appconf.title;
    $scope.menu = menu;
    var jwt = localStorage.getItem($scope.appconf.jwt_id);
    if(jwt) { $scope.user = jwtHelper.decodeToken(jwt); }

    //this is a crap..
    $scope.reset_urls = function($routeParams) {
        appconf.breads.forEach(function(item) {
            if(!item.url) item.url = "#/"+item.id+"/"+$routeParams.instid;
        });
    }
}]);

app.controller('StartController', ['$scope', 'toaster', '$http', 'jwtHelper', 'scaMessage', 'instance', '$routeParams', '$location',
function($scope, toaster, $http, jwtHelper, scaMessage, instance, $routeParams, $location) {
    //scaMessage.show(toaster);
    $location.path("/process/"+$routeParams.instid).replace();
    //$scope.reset_urls($routeParams);
    /*
    instance.load($routeParams.instid).then(function(_instance) { 
        $scope.instance = _instance; 
    });
    */

    /*
    $scope.submit = function() {
        if(!$scope.instance.config) $scope.instance.config = {};
        //$scope.instance.config.description = $scope.desc;    
        instance.save($scope.instance).then(function() {
            console.log("instance saved");
            $location.path($routeParams.instid+"/upload");
        });
    }
    */
    //console.log("going to /process");
}]);

/*
app.controller('UploadController', ['$scope', 'toaster', '$http', 'jwtHelper', 'scaMessage', 'instance', '$routeParams', '$location', 
function($scope, toaster, $http, jwtHelper, scaMessage, instance, $routeParams, $location) {
    scaMessage.show(toaster);
    $scope.reset_urls($routeParams);

    $scope.back = function() { $location.path("/start/"+$routeParams.instid); }
    
    $scope.next = function() {
        if($scope.changed)  $location.path("/import");
        else $location.path("/process");
    }
}]);
*/

app.controller('ImportController', ['$scope', 'toaster', '$http', 'jwtHelper', 'scaMessage', 'instance', '$routeParams', '$location', '$timeout', 'scaTask',
function($scope, toaster, $http, jwtHelper, scaMessage, instance, $routeParams, $location, $timeout, scaTask) {
    scaMessage.show(toaster);
    $scope.reset_urls($routeParams);

    instance.load($routeParams.instid).then(function(_instance) { 
        $scope.instance = _instance; 
    });

    $scope.taskid = $routeParams.taskid;

    $scope.task = scaTask.get($routeParams.taskid);

    $scope.$watchCollection('task', function(task) {
        if(task.status == "finished") $location.path("/process/"+$routeParams.instid);
    });

    $scope.back = function() {
        $location.path("/input/"+$routeParams.instid);
    }
}]);

app.controller('ProcessController', ['$scope', 'toaster', '$http', 'jwtHelper', 'scaMessage', 'instance', '$routeParams', '$location', '$interval',
function($scope, toaster, $http, jwtHelper, scaMessage, instance, $routeParams, $location, $interval) {
    scaMessage.show(toaster);
    $scope.reset_urls($routeParams);

    instance.load($routeParams.instid).then(function(_instance) { 
        $scope.instance = _instance; 

        //set default parameters (TODO - not sure if this is the right place to do this)
        if(!$scope.instance.config) $scope.instance.config = {
            process: "recon"
        }
    });

    //find the latest successful nifti data products
    $http.get($scope.appconf.sca_api+"/task", {params: {
        //find one with nifti output
        where: {
            instance_id: $routeParams.instid,
            "products.type": "nifti",
            status: "finished",
        },
        //find the latest one
        sort: "-finish_date",
        limit: 1,
    }})
    .then(function(res) {
        if(res.data[0]) {
            $scope.input_task = res.data[0];
            $scope.inputs = $scope.input_task.products.files;

            //check all (TODO - if input hasn't changed, I should restore user selection)
            $scope.inputs.forEach(function(file) {
                file.checked = true;
            });
        }
    }, function(res) {
        if(res.data && res.data.message) toaster.error(res.data.message);
        else toaster.error(res.statusText);
    });

    /*
    //load previously submitted tasks
    $http.get($scope.appconf.sca_api+"/task", {params: {
        //find one with nifti output
        where: {
            instance_id: $routeParams.instid,
            service: "sca-service-freesurfer",
        }
    }})
    .then(function(res) {
        $scope.tasks = res.data;
    }, function(res) {
        if(res.data && res.data.message) toaster.error(res.data.message);
        else toaster.error(res.statusText);
    });
    */

    //make sure user has place to submit sca-service-freesurfer (if not.. alert user!)
    $http.get($scope.appconf.sca_api+"/resource/best", {params: {
        service: "soichih/sca-service-freesurfer",
    }}).then(function(res) {
        $scope.best = res.data;
    }, function(res) {
        if(res.data && res.data.message) toaster.error(res.data.message);
        else toaster.error(res.statusText);
    });

    $scope.open = function(task) {
        $location.path("/task/"+$routeParams.instid+"/"+task._id);
    }

    $scope.submit = function() {
        $scope.instance.config.input_task_id = $scope.input_task._id;
        
        //list input files checked
        $scope.instance.config.files = [];
        $scope.inputs.forEach(function(input) {
            if(input.checked) $scope.instance.config.files.push(input);
        });
        $scope.instance.config.files.forEach(function(file) { delete file.checked });
        
        //submit freesurfer
        $http.post($scope.appconf.sca_api+"/task", {
            instance_id: $scope.instance._id,
            service: "soichih/sca-service-freesurfer",
            config: $scope.instance.config,
            deps: [$scope.input_task._id],
        })
        .then(function(res) {
            $location.path("/task/"+$routeParams.instid+"/"+res.data.task._id);
        }, function(res) {
            if(res.data && res.data.message) toaster.error(res.data.message);
            else toaster.error(res.statusText);
        });
    }

    $scope.addinput = function() {
        $location.path("/input/"+$routeParams.instid);
    }

    //$scope.editingheader = false;
    $scope.editheader = function() {
        $scope.editingheader = true;
    }

    $scope.updateheader = function() {
        instance.save($scope.instance).then(function(_instance) { 
            $scope.editingheader = false;
        }, function(res) {
            if(res.data && res.data.message) toaster.error(res.data.message);
            else toaster.error(res.statusText);
        });
    }
}]);

app.controller('InputController', ['$scope', 'toaster', '$http', 'jwtHelper', 'scaMessage', 'instance', '$routeParams', '$location',
function($scope, toaster, $http, jwtHelper, scaMessage, instance, $routeParams, $location) {
    scaMessage.show(toaster);
    $scope.reset_urls($routeParams);
    instance.load($routeParams.instid).then(function(_instance) { 
        $scope.instance = _instance; 
        //if(!$scope.instance.config) $scope.instance.config = {};
        //if(!$scope.instance.config.sda) $scope.instance.config.sda = {};
    });
    
    //load sda resources
    $http.get($scope.appconf.sca_api+"/resource", {params: {
        where: {type: 'hpss'},
    }})
    .then(function(res) {
        $scope.hpss_resources = res.data;
        if(res.data.length > 0) {
            if(!$scope.instance.config) $scope.instance.config = {};
            if(!$scope.instance.config.sda) $scope.instance.config.sda = {};
            $scope.instance.config.sda.resource = res.data[0];
        }
    }, function(res) {
        if(res.data && res.data.message) toaster.error(res.data.message);
        else toaster.error(res.statusText);
    });

    $scope.back = function() {
        $location.path("/process/"+$routeParams.instid);
    }
    $scope.fromurl = function(url) {
        //first submit download service
        $http.post($scope.appconf.sca_api+"/task", {
            instance_id: $scope.instance._id,
            service: "soichih/sca-product-raw", 
            config: { 
                download: [{dir:"download", url:url}],
            }
        })
        .then(function(res) {
            var curl_task = res.data.task;

            //then submit import with curl service as dependency
            $http.post($scope.appconf.sca_api+"/task", {
                instance_id: $scope.instance._id,
                service: "soichih/sca-product-nifti", //invoke product-nifti's importer
                config: { 
                    source_dir: curl_task._id+"/download" //import source
                },
                deps: [curl_task._id],
            })
            .then(function(res) {
                //$location.path("/import/"+$routeParams.instid+"/"+res.data.task.progress_key);
                $location.path("/import/"+$routeParams.instid+"/"+res.data.task._id);
            }, function(res) {
                if(res.data && res.data.message) toaster.error(res.data.message);
                else toaster.error(res.statusText);
            });

        }, function(res) {
            if(res.data && res.data.message) toaster.error(res.data.message);
            else toaster.error(res.statusText);
        });
    }

    $scope.fromsda = function() {
        var form = $scope.instance.config.sda;
        $http.post($scope.appconf.sca_api+"/task", {
            instance_id: $scope.instance._id,
            service: "soichih/sca-service-hpss",
            config: {
                get: [{localdir:"download", hpsspath:form.path}],
                auth: {
                    username: form.resource.config.username,
                    keytab: form.resource._id+".keytab",
                }
            },
            resource_deps: [form.resource._id], //need this to make sure the keytab exists
        })
        .then(function(res) {
            $location.path("/import/"+$routeParams.instid+"/"+res.data.task._id);
        }, function(res) {
            if(res.data && res.data.message) toaster.error(res.data.message);
            else toaster.error(res.statusText);
        });
    }

    $scope.doneupload = function() {
        $http.post($scope.appconf.sca_api+"/task", {
            instance_id: $scope.instance._id,
            service: "soichih/sca-product-nifti", //invoke product-nifti's importer
            config: { 
                source_dir: $scope.appconf.upload_task_id,
            }
        })
        .then(function(res) {
            $location.path("/import/"+$routeParams.instid+"/"+res.data.task._id);
        }, function(res) {
            if(res.data && res.data.message) toaster.error(res.data.message);
            else toaster.error(res.statusText);
        });
    }
}]);

app.controller('TaskController', ['$scope', 'toaster', '$http', 'jwtHelper', 'scaMessage', 'instance', '$routeParams', '$location', 'scaTask',
function($scope, toaster, $http, jwtHelper, scaMessage, instance, $routeParams, $location, scaTask) {
    scaMessage.show(toaster);
    $scope.reset_urls($routeParams);

    $scope.taskid = $routeParams.taskid;
    $scope.jwt = localStorage.getItem($scope.appconf.jwt_id);

    $scope.task = scaTask.get($routeParams.taskid);

    $scope.resource = null; //resource where this task is running/ran

    //need to keep watching until resource get set
    $scope.$watchCollection('task', function(task) {
       //also load resource info
        if(task.resource_id && !$scope.resource) {
            $scope.resource = {}; //prevent double loading while I wait response from /resource
            $http.get($scope.appconf.sca_api+"/resource", {params: {
                where: {_id: task.resource_id}
            }})
            .then(function(res) {
                $scope.resource = res.data[0];
                //console.dir($scope.resource);
            }, function(res) {
                if(res.data && res.data.message) toaster.error(res.data.message);
                else toaster.error(res.statusText);
            });
        }
    });
    
    $scope.back = function() {
        $location.path("/process/"+$routeParams.instid);
    }
}]);

//just a list of previously submitted tasks
app.controller('TasksController', ['$scope', 'menu', 'scaMessage', 'toaster', 'jwtHelper', '$http', '$location', '$routeParams', 'instance',
function($scope, menu,  scaMessage, toaster, jwtHelper, $http, $location, $routeParams, instance) {
    scaMessage.show(toaster);
    $scope.reset_urls($routeParams);

    instance.load($routeParams.instid).then(function(_instance) { $scope.instance = _instance; });

    //load previously submitted tasks
    $http.get($scope.appconf.sca_api+"/task", {params: {
        where: {
            instance_id: $routeParams.instid,
            service: "soichih/sca-service-freesurfer",
        }
    }})
    .then(function(res) {
        $scope.tasks = res.data;
    }, function(res) {
        if(res.data && res.data.message) toaster.error(res.data.message);
        else toaster.error(res.statusText);
    });

    $scope.open = function(task) {
        $location.path("/task/"+$routeParams.instid+"/"+task._id);
    }
    $scope.back = function() {
        $location.path("/process/"+$routeParams.instid);
    }
}]);

