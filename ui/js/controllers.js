'use strict';

app.controller('PageController', ['$scope', 'appconf', '$route', 'toaster', '$http', 'jwtHelper', 'menu', '$window', '$anchorScroll', 
function($scope, appconf, $route, toaster, $http, jwtHelper, menu, $window, $anchorScroll) {
    $scope.appconf = appconf;
    $scope.title = appconf.title;
    $scope.menu = menu;
    var jwt = localStorage.getItem($scope.appconf.jwt_id);
    if(jwt) {
        $scope.user = jwtHelper.decodeToken(jwt);
    }
}]);

app.controller('StartController', ['$scope', 'toaster', '$http', 'jwtHelper', 'scaMessage', 'instance', '$routeParams', '$location',
function($scope, toaster, $http, jwtHelper, scaMessage, instance, $routeParams, $location) {
    scaMessage.show(toaster);
    $location.path("/process/"+$routeParams.instid);
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

app.controller('UploadController', ['$scope', 'toaster', '$http', 'jwtHelper', 'scaMessage', 'instance', '$routeParams', '$location', 
function($scope, toaster, $http, jwtHelper, scaMessage, instance, $routeParams, $location) {
    scaMessage.show(toaster);

    $scope.back = function() {
        //$location.path($scope.instance._id+"/start");
        $location.path("/start/"+$routeParams.instid);
    }
    $scope.$on("file_uploaded", function() {
        console.log("file_uploaded");
        $scope.changed = true;
    });
    
    $scope.next = function() {
        if($scope.changed) {
            $location.path("/import");
        } else {
            $location.path("/process");
        }
    }
}]);

app.controller('ImportController', ['$scope', 'toaster', '$http', 'jwtHelper', 'scaMessage', 'instance', '$routeParams', '$location', '$timeout', 
function($scope, toaster, $http, jwtHelper, scaMessage, instance, $routeParams, $location, $timeout) {
    scaMessage.show(toaster);

    instance.load($routeParams.instid).then(function(_instance) { 
        $scope.instance = _instance; 
    });

    /*
    $http.get($scope.appconf.sca_api+"/task/byid/"+$routeParams.taskid)
    .then(function(res) {
        $scope.task = res.data;
    }, function(res) {
        if(res.data && res.data.message) toaster.error(res.data.message);
        else toaster.error(res.statusText);
    });
    */
    load_progress();

    var t_load_progress = null;
    function load_progress() {
        $http.get($scope.appconf.progress_api+"/status/"+$routeParams.progresskey, {params: {
            depth: 2,
        }})
        .then(function(res) {
            $scope.progress = res.data;
            if($scope.progress.status != "finished" || $scope.progress.status != "failed") {
                t_load_progress = $timeout(load_progress, 3000); //TODO make it smarter..
            }
            if($scope.progress.status == "finished") {
                toaster.success("Nifti files imported successfully");
                $location.path("/process/"+$routeParams.instid);
            }
        }, function(res) {
            if(res.data && res.data.message) toaster.error(res.data.message);
            else toaster.error(res.statusText);
        });
    }
    $scope.$on("$locationChangeSuccess", function() {
        if(t_load_progress) {
            $timeout.cancel(t_load_progress);
            t_load_progress = null;
        }
    });
    $scope.back = function() {
        $location.path("/input/"+$routeParams.instid);
    }
}]);

app.controller('ProcessController', ['$scope', 'toaster', '$http', 'jwtHelper', 'scaMessage', 'instance', '$routeParams', '$location', '$interval',
function($scope, toaster, $http, jwtHelper, scaMessage, instance, $routeParams, $location, $interval) {
    scaMessage.show(toaster);

    /*
    $scope.input_task = null; //task used as input
    $scope.inputs = []; //available inputs
    */
    $scope.form = {
        process: "recon", 
    }
    //$scope.tasks = []; //running and previously submitted tasks

    instance.load($routeParams.instid).then(function(_instance) { 
        $scope.instance = _instance; 
    });

    //find the latest successful nifti data products
    $http.get($scope.appconf.sca_api+"/task/query", {params: {
        //find one with nifti output
        where: {
            instance_id: $routeParams.instid,
            "products.type": "nifti",
            status: "finished",
        },
        //find the latest one
        sort: "-update_date",
        limit: 1,
    }})
    .then(function(res) {
        /*
        if(!res.data.length) toaster.error("No Nifti data products found. Please import first.");
        else {
            $scope.input_task = res.data[0];
            $scope.inputs = $scope.input_task.products.files;
            //select all by default
            $scope.inputs.forEach(function(file) {
                $scope.form.inputs.push(file);
            });
        } 
        */
        $scope.input_task = res.data[0];
        $scope.inputs = $scope.input_task.products.files;
        $scope.inputs.forEach(function(file) {
            file.checked = true;
        });
    }, function(res) {
        if(res.data && res.data.message) toaster.error(res.data.message);
        else toaster.error(res.statusText);
    });

    //load previously submitted tasks
    $http.get($scope.appconf.sca_api+"/task/query", {params: {
        //find one with nifti output
        where: {
            instance_id: $routeParams.instid,
            service_id: "sca-service-freesurfer",
        }
    }})
    .then(function(res) {
        $scope.tasks = res.data;
        /*
        $scope.tasks.forEach(function(task) {
            if(task.status == "running") {
                load_progress(task); 
            }
        });
        */
    }, function(res) {
        if(res.data && res.data.message) toaster.error(res.data.message);
        else toaster.error(res.statusText);
    });

    /*
    function load_task(task) {
        $http.get($scope.appconf.sca_api+"/task/byid/"+task._id)
        .then(function(res) {
            console.log("task "+task._id+" updated");
            console.dir(res.data);
            for(var k in res.data) {
                task[k] = res.data[k];
            }
            //if(task.status == "running") {
                //still running.. load progress
                load_progress(task);
            //}
            if(task.status == "finished") {
                console.log("task finished.. removing progress");
                delete task.progress;
            }
        }, function(res) {
            if(res.data && res.data.message) toaster.error(res.data.message);
            else toaster.error(res.statusText);
        });
    }

    function load_progress(task) {
        $http.get($scope.appconf.progress_api+"/status/"+task.progress_key, {params: {
            //depth: 2,
        }})
        .then(function(res) {
            console.log("progress info for task "+task._id+" updated");
            console.dir(res.data);
            task.progress = res.data;
        }, function(res) {
            if(res.data && res.data.message) toaster.error(res.data.message);
            else toaster.error(res.statusText);
        });
    }


    $scope.back = function() {
        $location.path($routeParams.instid+"/upload");
    }
    */
    $scope.open = function(task) {
        $location.path("/task/"+$routeParams.instid+"/"+task._id);
    }
    $scope.submit = function() {

        $scope.form.input_task_id = $scope.input_task._id;
        
        //list input files checked
        $scope.form.files = [];
        $scope.inputs.forEach(function(input) {
            if(input.checked) $scope.form.files.push(input);
        });
        $scope.form.files.forEach(function(file) { delete file.checked });
        
        //submit freesurfer
        $http.post($scope.appconf.sca_api+"/task", {
            instance_id: $scope.instance._id,
            service_id: "sca-service-freesurfer",
            /*
            config: { 
                input_task_id: $scope.input_task._id, //latest nifti import task
                files: inputs,
                all: $scope.form.all,
                hipposubfields: $scope.form.hipposubfields,
            },
            */
            config: $scope.form,
        })
        .then(function(res) {
            //$scope.tasks.push(res.data.task);
            $location.path("/task/"+$routeParams.instid+"/"+res.data.task._id);
        }, function(res) {
            if(res.data && res.data.message) toaster.error(res.data.message);
            else toaster.error(res.statusText);
        });
    }

    $scope.addinput = function() {
        $location.path("/input/"+$routeParams.instid);
    }
}]);

app.controller('InputController', ['$scope', 'toaster', '$http', 'jwtHelper', 'scaMessage', 'instance', '$routeParams', '$location',
function($scope, toaster, $http, jwtHelper, scaMessage, instance, $routeParams, $location) {
    scaMessage.show(toaster);
    instance.load($routeParams.instid).then(function(_instance) { 
        $scope.instance = _instance; 
    });
    $scope.back = function() {
        $location.path("/process/"+$routeParams.instid);
    }
    $scope.fromurl = function(url) {

        //submit curl service
        $http.post($scope.appconf.sca_api+"/task", {
            instance_id: $scope.instance._id,
            service_id: "sca-service-curl", 
            config: { 
                urls: [url],
            }
        })
        .then(function(res) {
            var curl_task = res.data.task;

            //then submit import with curl service as dependency
            $http.post($scope.appconf.sca_api+"/task", {
                instance_id: $scope.instance._id,
                service_id: "sca-product-nifti", //invoke product-nifti's importer
                config: { 
                    source_dir: curl_task._id+"/download" //import source
                },
                deps: [curl_task._id],
            })
            .then(function(res) {
                $location.path("/import/"+$routeParams.instid+"/"+res.data.task.progress_key);
            }, function(res) {
                if(res.data && res.data.message) toaster.error(res.data.message);
                else toaster.error(res.statusText);
            });

        }, function(res) {
            if(res.data && res.data.message) toaster.error(res.data.message);
            else toaster.error(res.statusText);
        });
    }

    $scope.doneupload = function() {
        $http.post($scope.appconf.sca_api+"/task", {
            instance_id: $scope.instance._id,
            service_id: "sca-product-nifti", //invoke product-nifti's importer
            config: { 
                source_dir: $scope.appconf.input_task_id,
            }
        })
        .then(function(res) {
            //$scope.progress_key = res.data.task.progress_key;
            //$location.path("/import/"+$routeParams.instid+"/"+res.data.task._id);
            $location.path("/import/"+$routeParams.instid+"/"+res.data.task.progress_key);
        }, function(res) {
            if(res.data && res.data.message) toaster.error(res.data.message);
            else toaster.error(res.statusText);
        });
    }
}]);

app.controller('TaskController', ['$scope', 'toaster', '$http', 'jwtHelper', 'scaMessage', 'instance', '$routeParams', '$location', '$timeout', 
function($scope, toaster, $http, jwtHelper, scaMessage, instance, $routeParams, $location, $timeout) {
    scaMessage.show(toaster);
    $scope.taskid = $routeParams.taskid; 
    $scope.path = $routeParams.instid+"/"+$scope.taskid; //path to open by default

    //for file service
    $scope.jwt = localStorage.getItem($scope.appconf.jwt_id);

    load();

    var tm = null;
    function load() {
        $http.get($scope.appconf.sca_api+"/task/byid/"+$scope.taskid)
        .then(function(res) {
            $scope.task = res.data;
            $scope.resource_id = $scope.task.resource_id;

            //load new task status unless it's finished/failed
            if($scope.task.status != "finished" && $scope.task.status != "failed" && $scope.task.status != "stopped") {
                tm = $timeout(load, 3*1000); //reload in 3 seconds
            }

            //load progress info
            $http.get($scope.appconf.progress_api+"/status/"+$scope.task.progress_key, {params: { depth: 2, }})
            .then(function(res) {
                $scope.progress = res.data;
            }, function(res) {
                if(res.data && res.data.message) toaster.error(res.data.message);
                else toaster.error(res.statusText);
            });

        }, function(res) {
            if(res.data && res.data.message) toaster.error(res.data.message);
            else toaster.error(res.statusText);
        });
    }

    $scope.back = function() {
        $location.path("/process/"+$routeParams.instid);
    }

    $scope.stop = function() {
        $http.put($scope.appconf.sca_api+"/task/stop/"+$scope.task._id)
        .then(function(res) {
            toaster.success("Requested to stop this task");
        }, function(res) {
            if(res.data && res.data.message) toaster.error(res.data.message);
            else toaster.error(res.statusText);
        });
    }

    $scope.rerun = function() {
        $http.put($scope.appconf.sca_api+"/task/rerun/"+$scope.task._id)
        .then(function(res) {
            toaster.success("Requested to rerun this task");
            load();
        }, function(res) {
            if(res.data && res.data.message) toaster.error(res.data.message);
            else toaster.error(res.statusText);
        });
    }

    //setup task refresher
    $scope.$on("$locationChangeSuccess", function() {
        if(tm) $timeout.cancel(tm);
    });

}]);

