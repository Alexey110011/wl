/*global location history */
sap.ui.define([
		"zjblessons/Worklist/controller/BaseController",
		"sap/ui/model/json/JSONModel",
		"zjblessons/Worklist/model/formatter",
		"sap/m/Table",
		"sap/m/Toolbar",
		"sap/m/Title",
		"sap/m/ToolbarSpacer",
		"sap/m/Button",
		"sap/m/SearchField",
		"sap/m/Column",
		"sap/m/ColumnListItem",
		"sap/m/Label",
		"sap/m/Text",
		"sap/m/Switch",
		"sap/ui/model/Filter",
		"sap/ui/model/FilterOperator"
	], function (BaseController, JSONModel, formatter, Table, Toolbar, Title, ToolbarSpacer, Button, SearchField, Column, ColumnListItem, Label, Text, Switch, Filter, FilterOperator) {
		"use strict";

		return BaseController.extend("zjblessons.Worklist.controller.Worklist", {

			formatter: formatter,
			
			onInit : function () {
				var oTable = this._getTableTemplate();
				this.getView().byId("container").addContent(oTable);
				var oViewModel,
					iOriginalBusyDelay;

					iOriginalBusyDelay = oTable.getBusyIndicatorDelay();
				
					this._aTableSearchState = [];

				
				oViewModel = new JSONModel({
					worklistTableTitle : this.getResourceBundle().getText("worklistTableTitle"),
					shareOnJamTitle: this.getResourceBundle().getText("worklistTitle"),
					shareSendEmailSubject: this.getResourceBundle().getText("shareSendEmailWorklistSubject"),
					shareSendEmailMessage: this.getResourceBundle().getText("shareSendEmailWorklistMessage", [location.href]),
					tableNoDataText : this.getResourceBundle().getText("tableNoDataText"),
					tableBusyDelay : 0
				});
				this.setModel(oViewModel, "worklistView");

				oTable.attachEventOnce("updateFinished", function(){
					// Restore original busy indicator delay for worklist's table
					oViewModel.setProperty("/tableBusyDelay", iOriginalBusyDelay);
				});
			},

			onUpdateFinished : function (oEvent) {
				var sTitle,
					oTable = oEvent.getSource(),
					iTotalItems = oEvent.getParameter("total");
				
				if (iTotalItems && oTable.getBinding("items").isLengthFinal()) {
					sTitle = this.getResourceBundle().getText("worklistTableTitleCount", [iTotalItems]);
				} else {
					sTitle = this.getResourceBundle().getText("worklistTableTitle");
				}
				this.getModel("worklistView").setProperty("/worklistTableTitle", sTitle);
			},

			/**
			 * Event handler when a table item gets pressed
			 * @param {sap.ui.base.Event} oEvent the table selectionChange event
			 * @public
			 */
			 
			_getTableTemplate : function () {
				var oTable  =  new Table({
				 id:'table',
				 headerToolbar: new Toolbar({
				 	content:[
				 		new Toolbar({
				 			content:[
					 		new Title({
					 			id:"tableHeader",
					 			text:"{worklistView>/worklistTableTitle}"
					 		}),
						 		new ToolbarSpacer({}),
						 		new Button({
						 			id : "create_button1",
									text : "Create",
									type : "Emphasized",
									press : this.onOpenAddBase_HeaderDialog.bind(this)
						 		}),
						 		new SearchField({
						 			id : "searchField",
									tooltip : "{i18n>worklistSearchTooltip}",
									search : this.onSearch.bind(this),
									width : "auto"
						 		})
						 	]
						})
					]
				}),
				 columns: [
						new Column({
						header : new Label({
							text:"DocumentNumber"
							})
						}),
						new Column({
							header : new Label({
								text:"DocumentDate"
							})
						}),
						new Column({
							header : new Label({
								text:"PlantText"
							})
						}),
						new Column({
							header : new Label({
								text:"RegionText"
							})
						}),
						new Column({
							header : new Label({
								text:"Description"
							})
						}),
						new Column({
							header : new Label({
								text:"Created"
							})
						}),
						new Column({
							header: new Label({
								text:"Switch version"
							})
						})
					]
				});
				var oTemplate = new ColumnListItem({
					type: "Navigation",
					navigated: true,
					press: this.onPress.bind(this),
					cells: [
						new Text ({
							text: '{DocumentNumber}'
						}),
						new Text ({
							text: '{DocumentDate}'
						}),
						new Text ({
							text: '{PlantText}'
						}),
						new Text ({
							text: '{RegionText}'
						}),
						new Text ({
							text: '{Description}'
						}),
						new Text ({
							text: '{Created}'
						}),
						new Switch ({
							state: true,
							change: this.onChangeSwitch.bind(this)
						})
					]
				});
				
				/*oColumns.map(function(column){
					oTable.addColumn(column);
					});*/
					
				oTable.bindItems('/zjblessons_base_Headers', oTemplate);
				return oTable;
		},
			
			onPress : function (oEvent) {
				// The source is the list item that got pressed
				this._showObject(oEvent.getSource());
			},

			onNavBack : function() {
				history.go(-1);
			},


			onSearch : function (oEvent) {
				if (oEvent.getParameters().refreshButtonPressed) {
					// Search field's 'refresh' button has been pressed.
					// This is visible if you select any master list item.
					// In this case no new search is triggered, we only
					// refresh the list binding.
					this.onRefresh();
				} else {
					var aTableSearchState = [];
					var sQuery = oEvent.getParameter("query");

					if (sQuery && sQuery.length > 0) {
						aTableSearchState = [new Filter("DocumentNumber", FilterOperator.Contains, sQuery)];
					}
					this._applySearch(aTableSearchState);
				}

			},

			onRefresh : function () {
				var oTable = this.byId("table");
				oTable.getBinding("items").refresh();
			},

			_showObject : function (oItem) {
				this.getRouter().navTo("object", {
					objectId: oItem.getBindingContext().getProperty("HeaderID")
				});
			},

			_applySearch: function(aTableSearchState) {
				var oTable = this.byId("table"),
					oViewModel = this.getModel("worklistView");
				oTable.getBinding("items").filter(aTableSearchState, "Application");
				// changes the noDataText of the list in case there are no filter results
				if (aTableSearchState.length !== 0) {
					oViewModel.setProperty("/tableNoDataText", this.getResourceBundle().getText("worklistNoDataWithSearchText"));
				}
			},
			
			//Диалог для создания нового base_Header 
			onOpenAddBase_HeaderDialog: function(){
				if(!this.addBase_HeaderDialog){
					this.addBase_HeaderDialog  =  this.loadFragment({
						name:"zjblessons.Worklist.view.AddBase_HeaderDialog"
					});
				} 
				this.addBase_HeaderDialog.then(function(oDialog){
					oDialog.open();
				});
			},
			
			onCloseAddBase_HeaderDialog: function(){
				this.byId("addBase_HeaderDialog").close();
			},
			
			onAddItem : function (){
				//Пользовательские inputs
			  	var sId = this.getView().byId("idID").getValue();
			 	var sDocumentNumber = this.getView().byId("idDocumentNumber").getValue();
			 	var sDocumentDate = this.getView().byId("DP2").getValue();
			 	var sDescription = this.getView().byId("idDescription").getValue();
			 	//Должны связываться с другими таблицами
			 	//var sPlantText = this.getView().byId("idPlantText").getValue();
			 	//var sRegionText = this.getView().byId("idRegionText").getValue();
			 	var sInstance = this.getView().byId("idInstance").getValue();
			 	var sVersion = this.getView().byId("idVersion").getValue();
			 	
			 	var oModel = this.getView().getModel();
			 	var oContext  = oModel.createEntry('/tHeaders', {
			 			properties:{
			 				ID: sId,
			 				DocumentNumber : sDocumentNumber,
			 				DocumentDate : sDocumentDate,
			 				Description : sDescription,
			 				//PlantText : sPlantText,
			 				//RegionText : sRegionText,
			 				Instance : sInstance,
			 				Version : sVersion
			 			}
			 		});
			 		oContext.created()
			 		.then(
			 			oModel.submitChanges({
			 				success:this.mySuccessHandler(oModel),
			 				error:this.myErrorHandler
			 				
			 			})
			 		);
			 },
			 
			mySuccessHandler :function(oModel){
				oModel.read('/tHeaders',{
					success:function(oData){
						console.log(oData);
					},
					error:function(oError){
						console.log("Error", oError)
					}
				});
			},
			
			myErrorHandler :function(oError){
				console.log("Error", oError);
			},
			
			//Функция для создания нового base_Header
			
			onAdd_base_Header : function (){
			  	var sHeaderId = this.getView().byId("idHeaderIDH").getValue();
			  	var sDocumentNumber = this.getView().byId("idDocumentNumberH").getValue();
			 	var sDescription = this.getView().byId("idDescriptionH").getValue();
			 	var sPlantText = this.getView().byId("idPlantTextH").getValue();
			 	var sRegionText = this.getView().byId("idRegionTextH").getValue();
			 	var sCreatedBy = this.getView().byId("idCreatedByH").getValue();
			 	var sVersion = this.getView().byId("idVersionH").getValue();
			 	var oModel = this.getView().getModel();
			 	var oContext  = oModel.createEntry('/zjblessons_base_Headers', {
			 			properties:{
			 				HeaderID:sHeaderId,
			 				DocumentNumber : sDocumentNumber,
			 				Description : sDescription,
			 				PlantText : sPlantText,
			 				RegionText : sRegionText,
			 				CreatedBy : sCreatedBy,
			 				Version : sVersion
			 			}
			 		});
			 		oContext.created().then(
			 			oModel.submitChanges({
			 				success:this.mySuccessBase_HeadersHandler(oModel),
			 				error:this.myErrorHeaderHandler})
			 		);
			},
			 
			 mySuccessBase_HeadersHandler :function(oModel){
				console.log("PendingContext", oModel.getPendingChanges());
				oModel.read('/zjblessons_base_Headers',{
					success:function(oData, oResponse){
						console.log("oData",oData)
					},
					error:function(oError){
						console.log("Error", oError);
					}
				});
			},
			
			myErrorBase_HeadersHandler :function(){
				console.log("base_Headers, error");
			}, 
			
			onFilterSelect: function (oEvent) {
			var oBinding = this.byId("table").getBinding("items"),
				sKey = oEvent.getParameter("key"),
				// Array to combine filters
				aFilters = [];

			if (sKey === "Deactivated") {
				aFilters.push(
					new Filter([
						new Filter([new Filter("Version", "EQ", "D")], true)//,
						])
					);
				}
			oBinding.filter(aFilters);
		},
		
	     onChangeSwitch :function (oEvent){
	        var oModel = this.getView().getModel();
	     	var sPath = oEvent.getSource().getBindingContext().getPath();
	     	console.log(sPath);
	     	var sState = oEvent.getSource().getProperty("state"); 
	     	var oData = sState?{Version:"D"}:{Version:"A"};
	     	this.getModel().update(sPath, 
	     		oData, 
	     		{success:this.myUpdateSuccess(oModel), error:this.myUpdateError}
	     	);
	     },
	     
	     	/*onAdd_base_Header1 : function (){
	     		var oModel = this.getView().getModel();
	     		var sDocumentNumber = this.getView().byId("idDocumentNumberH").getValue();
			 	var sDescription = this.getView().byId("idDescriptionH").getValue();
			 	var sPlantText = this.getView().byId("idPlantTextH").getValue();
			 	var sRegionText = this.getView().byId("idRegionTextH").getValue();
			 	
					var oContext  = oModel.createEntry('/zjblessons_base_Headers', {
			 			properties:{
			 				HeaderID:"0",
			 				DocumentNumber : sDocumentNumber,
			 				Description : sDescription,
			 				PlantText : sPlantText,
			 				RegionText : sRegionText,
			 				CreatedBy : sCreatedBy,
			 				Version : "A"
			 			}
			 		});
			 		oContext.created().then(
			 			oModel.submitChanges({success:this.mySuccessBase_HeadersHandler(oModel), error:this.myErrorHeaderHandler})
			 		);
			 			console.log("Odata",oModel);
	     	},*/
	     	
			myUpdateSuccess: function(oModel){
				oModel.read('/zjblessons_base_Headers',{
					success:function(oData, oResponse){
						console.log(oModel.oData)
					},
					error:function(oError){
						console.log("Error", oError);
					}
				});
			},
			myUpdateError :function(){
				console.log("base_Headers, error");
			}
			
		});
	}
);