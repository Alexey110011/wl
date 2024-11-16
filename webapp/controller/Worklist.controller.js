/*global location history */
sap.ui.define([
		"zjblessons/Worklist/controller/BaseController",
		"sap/ui/model/json/JSONModel",
		"zjblessons/Worklist/model/formatter",
		"sap/ui/model/Filter",
		"sap/ui/model/FilterOperator"
	], function (BaseController, JSONModel, formatter, Filter, FilterOperator/**/) {
		"use strict";

		return BaseController.extend("zjblessons.Worklist.controller.Worklist", {

			formatter: formatter,
			//oModel : this.getView().getModel(),
			/* =========================================================== */
			/* lifecycle methods                                           */
			/* =========================================================== */

			/**
			 * Called when the worklist controller is instantiated.
			 * @public
			 */
			onInit : function () {
				var oViewModel,
					iOriginalBusyDelay,
					oTable = this.byId("table");

				// Put down worklist table's original value for busy indicator delay,
				// so it can be restored later on. Busy handling on the table is
				// taken care of by the table itself.
				iOriginalBusyDelay = oTable.getBusyIndicatorDelay();
				// keeps the search state
				this._aTableSearchState = [];

				// Model used to manipulate control states
				oViewModel = new JSONModel({
					worklistTableTitle : this.getResourceBundle().getText("worklistTableTitle"),
					shareOnJamTitle: this.getResourceBundle().getText("worklistTitle"),
					shareSendEmailSubject: this.getResourceBundle().getText("shareSendEmailWorklistSubject"),
					shareSendEmailMessage: this.getResourceBundle().getText("shareSendEmailWorklistMessage", [location.href]),
					tableNoDataText : this.getResourceBundle().getText("tableNoDataText"),
					tableBusyDelay : 0
				});
				this.setModel(oViewModel, "worklistView");

				// Make sure, busy indication is showing immediately so there is no
				// break after the busy indication for loading the view's meta data is
				// ended (see promise 'oWhenMetadataIsLoaded' in AppController)
				oTable.attachEventOnce("updateFinished", function(){
					// Restore original busy indicator delay for worklist's table
					oViewModel.setProperty("/tableBusyDelay", iOriginalBusyDelay);
				});
			},

			/* =========================================================== */
			/* event handlers                                              */
			/* =========================================================== */

			/**
			 * Triggered by the table's 'updateFinished' event: after new table
			 * data is available, this handler method updates the table counter.
			 * This should only happen if the update was successful, which is
			 * why this handler is attached to 'updateFinished' and not to the
			 * table's list binding's 'dataReceived' method.
			 * @param {sap.ui.base.Event} oEvent the update finished event
			 * @public
			 */
			onUpdateFinished : function (oEvent) {
				// update the worklist's object counter after the table update
				var sTitle,
					oTable = oEvent.getSource(),
					iTotalItems = oEvent.getParameter("total");
				// only update the counter if the length is final and
				// the table is not empty
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
			/* onBeforeRendering : function () {
			
				this._getTableTemplate();
			},
			_getTableTemplate : function () {
				var oTable = this.byId('table');
				 var oColumns = [
						new sap.m.Column({
						header : new sap.m.Label({
							text:"DocumentNumber"
						})
					}),
						new sap.m.Column({
							header : new sap.m.Label({
								text:"DocumentDate"
							})
						}),
						new sap.m.Column({
							header : new sap.m.Label({
								text:"PlantText"
							})
						}),
						new sap.m.Column({
							header : new sap.m.Label({
								text:"RegionText"
							})
						}),
						new sap.m.Column({
							header : new sap.m.Label({
								text:"Description"
							})
						}),
						new sap.m.Column({
							header : new sap.m.Label({
								text:"Created"
							})
						})
				];
				var oTemplate = new sap.m.ColumnListItem({
					type: "Navigation",
					navigated: true,
					press: "onPress",  // при нажатии не работает
					cells: [
						new sap.m.Text ({
							text: '{DocumentNumber}'
						}),
						new sap.m.Text ({
							text: '{DocumentDate}'
						}),
						new sap.m.Text ({
							text: '{PlantText}'
						}),
						new sap.m.Text ({
							text: '{RegionText}'
						}),
						new sap.m.Text ({
							text: '{Description}'
						}),
						new sap.m.Text ({
							text: '{Created}'
						})
					]
				});
				
				oColumns.map(function(column){
					oTable.addColumn(column);
					});
					
				oTable.bindItems('/zjblessons_base_Headers', oTemplate);
			},*/
			
			onPress : function (oEvent) {
				// The source is the list item that got pressed
				this._showObject(oEvent.getSource());
			},

			/**
			 * Event handler for navigating back.
			 * We navigate back in the browser historz
			 * @public
			 */
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

			/**
			 * Event handler for refresh event. Keeps filter, sort
			 * and group settings and refreshes the list binding.
			 * @public
			 */
			onRefresh : function () {
				var oTable = this.byId("table");
				oTable.getBinding("items").refresh();
			},

			/* =========================================================== */
			/* internal methods                                            */
			/* =========================================================== */

			/**
			 * Shows the selected item on the object page
			 * On phones a additional history entry is created
			 * @param {sap.m.ObjectListItem} oItem selected Item
			 * @private
			 */
			_showObject : function (oItem) {
				this.getRouter().navTo("object", {
					objectId: oItem.getBindingContext().getProperty("HeaderID")
				});
			},

			/**
			 * Internal helper method to apply both filter and search state together on the list binding
			 * @param {sap.ui.model.Filter[]} aTableSearchState An array of filters for the search
			 * @private
			 */
			_applySearch: function(aTableSearchState) {
				var oTable = this.byId("table"),
					oViewModel = this.getModel("worklistView");
				oTable.getBinding("items").filter(aTableSearchState, "Application");
				// changes the noDataText of the list in case there are no filter results
				if (aTableSearchState.length !== 0) {
					oViewModel.setProperty("/tableNoDataText", this.getResourceBundle().getText("worklistNoDataWithSearchText"));
				}
			},
			//Added 14/11/2024
			onOpenAddItemDialog: function(){
				//console.log("Frag")
				if(!this.addItemDialog){
					this.addItemDialog  =  this.loadFragment({
						name:"zjblessons.Worklist.view.AddItemDialog"
					});
				} 
				this.addItemDialog.then(function(oDialog){
					oDialog.open();
				});
			},
			
			onCloseAddItemDialog: function(){
				this.byId("addItemDialog").close();
			},
			
			onOpenAddBase_HeaderDialog: function(){
				//console.log("Frag")
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
			  	//var sHeaderId = this.getView().byId("idHeaderID").getValue();
			  	var sId = this.getView().byId("idID").getValue();
			 	var sDocumentNumber = this.getView().byId("idDocumentNumber").getValue();
			 	var sDocumentDate = this.getView().byId("DP2").getValue();
			 	var sDescription = this.getView().byId("idDescription").getValue();
			 	//var sPlantText = this.getView().byId("idPlantText").getValue();
			 	//var sRegionText = this.getView().byId("idRegionText").getValue();
			 	var sInstance = this.getView().byId("idInstance").getValue();
			 	var sVersion = this.getView().byId("idVersion").getValue();
			 	//console.log(sHeaderId);
			 		//var that = this;
				var oModel = this.getView().getModel();
			 	var oContext  = oModel.createEntry('/tHeaders', {
			 			properties:{
			 				//HeaderID:sHeaderId,
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
			 		//oForm.setBindingContext(oContext)
			 		//oModel.submitChanges({success:this.mySuccessHandler, error:this.myErrorHandler});
			 		oContext.created().then(/*function(data){
			 			console.log("Data",data);*/
			 			oModel.submitChanges({success:this.mySuccessHandler(oModel), error:this.myErrorHandler})
			 		//}
			 			//oModel.submitChanges({success:this.mySuccessHandler, error:this.myErrorHandler})
			 			);
			 			console.log("Odata",oModel);
			 },
			mySuccessHandler :function(oModel){
				//console.log("success");
				//var oModel = this.getView().getModel();
				oModel.read('/tHeaders',{
					success:function(oData, oResponse){
						console.log(oModel.oData)
					},
					error:function(oError){
						console.log("Error", oError)
					}
				});
			},
			myErrorHandler :function(){
				console.log("tHeader, error");
			},
			
			onOpenModel : function (){
				var oContext = this.getView().getModel();//getBindingContext().sPath;
				console.log(oContext)
			},
			
			onSubmitModel :function(){
				var oModel = this.getView().getModel();
				console.log("HPC",oModel.hasPendingChanges());
				if(oModel.hasPendingChanges()){
					oModel.submitChanges({success:this.mySuccessHandler, error:this.myErrorHandler()})
					/*.then(function(){
						console.log("oModel.oData");
					})*/;
				}
			},
				/*onOpenModelBase_Headers : function (){
				var oContext = this.getView().getModel();//getBindingContext().sPath;
				console.log(oContext)
			},*/
			
			onSubmitModelBase_Headers :function(){
				var oModel = this.getView().getModel();
				console.log("HPC",oModel.hasPendingChanges());
				if(oModel.hasPendingChanges()){
					oModel.submitChanges({success:this.mySuccessHandler, error:this.myErrorHandler()})
					/*.then(function(){
						console.log("oModel.oData");
					})*/;
				}
			},
				
				//Added
			onAdd_base_Header : function (){
			  	var sHeaderId = this.getView().byId("idHeaderIDH").getValue();
			  	var sDocumentNumber = this.getView().byId("idDocumentNumberH").getValue();
			 	var sDescription = this.getView().byId("idDescriptionH").getValue();
			 	var sPlantText = this.getView().byId("idPlantTextH").getValue();
			 	var sRegionText = this.getView().byId("idRegionTextH").getValue();
			 	var sCreatedBy = this.getView().byId("idCreatedByH").getValue();
			 	var sVersion = this.getView().byId("idVersionH").getValue();
			 	//console.log(sHeaderId);
			 		//var that = this;
				var oModel = this.getView().getModel();
			 	var oContext  = oModel.createEntry('/zjblessons_base_Headers', {
			 			properties:{
			 				HeaderID:sHeaderId,
			 				/*DocumentNumber : sDocumentNumber,
			 				Description : sDescription,
			 				PlantText : sPlantText,
			 				RegionText : sRegionText,
			 				CreatedBy : sCreatedBy,*/
			 				Version : sVersion
			 			}
			 		});
			 		oContext.created().then(
			 			oModel.submitChanges({success:this.mySuccessBase_HeadersHandler(oModel), error:this.myErrorHeaderHandler})
			 		);
			 			console.log("Odata",oModel);
			 },
			 
			 mySuccessBase_HeadersHandler :function(oModel){
				//console.log("success");
				//var oModel = this.getView().getModel();
				oModel.read('/zjblessons_base_Headers',{
					success:function(oData, oResponse){
						console.log(oModel.oData)
					},
					error:function(oError){
						console.log("Error", oError)
					}
				});
			},
			
			myErrorBase_HeadersHandler :function(){
				console.log("base_Headers, error");
			}, 
			onShowModel:function(){
				console.log(this.getView().getModel())
			}
				
			
			
		});
	}
);