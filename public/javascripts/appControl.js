//Agradecimientos a Addy Osmani por ser parte fundamental de mi proyecto, siendo una guia para realiar la aplicación (https://github.com/addyosmani/todomvc)
//Es importtante recalcar la gran ayuda que me dio mi compañero Fernando ruiz Velasco, ya que me motivó (a la fuerza) a que expandiera mi conocimiento en el desarrollo web.
//Finalmente, pero no menos importante, agradecimientos a la variada gama de tutoriales que utilicé en cada paso de la creación de esta app en node.js
//https://getbootstrap.com/docs/4.0/components/alerts/
//https://getbootstrap.com/docs/4.0/layout/grid/
//https://www.w3schools.com/cssref/css3_pr_box-shadow.asp
//https://github.com/expressjs/express/wiki/Migrating-from-3.x-to-4.x
//https://stackoverflow.com/questions/25550819/error-most-middleware-like-bodyparser-is-no-longer-bundled-with-express
//https://www.youtube.com/watch?v=iODZCxUDkwk&t=641s
//https://www.youtube.com/watch?v=2W03ZymI46g&t=712s
//https://www.youtube.com/watch?v=R52AsglN0DE
//https://www.youtube.com/watch?v=DX15WbKidXY
//https://www.youtube.com/watch?v=edOmvng5IQc
//https://www.youtube.com/watch?v=nleI7IbpGhc&t=1s
//https://www.youtube.com/watch?v=NA21dUBfJhw
//https://www.youtube.com/watch?v=IgAH0NqsJso
//https://www.youtube.com/watch?v=L4OP8JGKbQU

jQuery(function($){
	"use strict";


	var socket = io.connect();
	var widget = uploadcare.Widget('[role=uploadcare-uploader]');
	var app = {

		init: function(){
			this.list();
			this.actions();
			this.socketActions();
		},

		persist: function(new_todo){

			socket.emit('add', new_todo);
		},

		edit: function(edit_todo){

			socket.emit('edit', edit_todo);
		},

		destroy: function(todo_id){

			socket.emit('delete', { id:todo_id });
		},

		changeStatus: function(todo_id, todo_status){

			socket.emit('changestatus', { id: todo_id, status: todo_status });
		},

		allchangestatus: function(master_status){

			socket.emit('allchangestatus', { status: master_status });
		},

		actions: function(){
			$('#todo-form').submit(function(){
				if(!$('#new-todo').val()){
					return false;
				}
				var new_todo = {
					title: $('#new-todo').val(),
					file: $('#filecont').val(),
					complete: false
				}
				$('#new-todo').val('');

				app.persist(new_todo);
				widget.value(null);
				return false;
			});

			$('button.destroy').live('click', function(e){
				e.preventDefault();
				app.destroy($(this).attr('data-todoId'));
			});

			$('input.toggle').live('click', function(){
				if($(this).prop('checked')){
					app.changeStatus($(this).attr('data-todoId'), 'complete');
				}else{
					app.changeStatus($(this).attr('data-todoId'), 'incomplete');
				}

			});

			$('input#toggle-all').live('click', function(){
				if ($(this).prop('checked')) {
					app.allchangestatus('complete');
				}else{
					app.allchangestatus('incomplete');
				}
			});

			$('ul#todo-list li').live('dblclick', function(){
				$(this).addClass('editing');
				$(this).children('input.edit').focus();
			});

			$('input.edit').live('focusout',function(){

				if(!$(this).val()){
					app.destroy($(this).attr('data-todoId'));
				}else{
				$('li#'+$(this).attr('data-todoId')+' .view label').html($(this).val());
				var edit_todo = {
					title: $(this).val(),
					id: $(this).attr('data-todoId')
				}

				app.edit(edit_todo);
				$(this).parent().removeClass('editing');

				}

			});

			$('input.edit').live('keypress', function(e){
				 if(e.which == 13) {
				 	if(!$(this).val()){
						app.destroy($(this).attr('data-todoId'));
					}else{
					 	$('li#'+$(this).attr('data-todoId')+' .view label').html($(this).val());
					 	var edit_todo = {
							title: $(this).val(),
							id: $(this).attr('data-todoId')
						}
						app.edit(edit_todo);
	        			$(this).parent().removeClass('editing');

        			}
    			 }
			});


		},

		socketActions: function(){
			 socket.on('count', function (data) {
			    $('footer#footer').html(data.count+' users online.');
			  });

			 socket.on('added', function(data){
			 	app.addToList(data);
			 });

			 socket.on('deleted', function(data){
			 	app.destroyOnTodoList(data.id);
			 });

			 socket.on('statuschanged', function(data){
			 	app.markOnTodoList(data.id, data.status);
			 });

			 socket.on('edited', function(data){
			 	$('li#'+data._id+' .view label').html(data.title);
			 	$('li#'+data._id+' input.edit').val(data.title);
			 });

			 socket.on('allstatuschanged', function(data){
			 	app.markAllOnTodoList(data.status);
			 });
		},

		list: function(){
			socket.on('all', function(data){
				$('#todo-list').html('');
				for(var i = 0; i< data.length; i++){
					if(data[i].complete){
						$('#todo-list').append('<li id="'+data[i]._id+'" class="completed"><div class="view"><input data-todoId="'+data[i]._id+'" class="toggle" type="checkbox" checked><label>'+data[i].title+'</label><button data-todoId="'+data[i]._id+'" class="destroy"></button></div><input data-todoId="'+data[i]._id+'" class="edit" value="'+data[i].title+'"></li>');
					}else{
						$('#todo-list').append('<li id="'+data[i]._id+'"><div class="view"><input data-todoId="'+data[i]._id+'" class="toggle" type="checkbox"><label>'+data[i].title+'</label><button data-todoId="'+data[i]._id+'" class="destroy"></button></div><input data-todoId="'+data[i]._id+'" class="edit" value="'+data[i].title+'"></li>');
					}
				}
				app.mainSectionToggle();
			});

		},
		addToList: function(new_todo){
			$('#todo-list').append('<li id="'+new_todo._id+'"><div class="view"><input data-todoId="'+new_todo._id+'" class="toggle" type="checkbox"><label>'+new_todo.title+'</label><button data-todoId="'+new_todo._id+'" class="destroy"></button></div><input data-todoId="'+new_todo._id+'" class="edit" value="'+new_todo.title+'"></li>');
			app.mainSectionToggle();
		},
		destroyOnTodoList: function(todo_id){
			$('li#'+todo_id).remove();
			app.mainSectionToggle();
		},

		markOnTodoList: function(todo_id, todo_status){
			if(todo_status == 'complete'){
				$('li#'+todo_id).addClass('completed');
				$('li#'+todo_id+' div.view input.toggle').attr('checked', true);
			}else{
				$('li#'+todo_id).removeClass('completed');
				$('li#'+todo_id+' div.view input.toggle').attr('checked', false);
			}

			if($('input#toggle-all').prop('checked')){
				$('input#toggle-all').attr('checked', false);
			}
		},

		markAllOnTodoList: function(master_status){
			if(master_status == 'complete'){
				$('ul#todo-list li').addClass('completed');
				$('input.toggle').attr('checked', true);
				$('input#toggle-all').attr('checked', true);
			}else{
				$('ul#todo-list li').removeClass('completed');
				$('input.toggle').attr('checked', false);
				$('input#toggle-all').attr('checked', false);
			}
		},

		mainSectionToggle: function(){
			if(!$('ul#todo-list li').length){
				$('section#main').hide();
				$('footer#footer').hide();
			}else{
				$('section#main').show();
				$('footer#footer').show();
			}
		}
	};

	window.App = app.init();
});
