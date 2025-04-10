# websocket_manager.py
from typing import Dict, List, Set
from fastapi import WebSocket, WebSocketDisconnect
import logging
import uuid
import json

logger = logging.getLogger(__name__)

class ConnectionManager:
    def __init__(self):
        # Maps report_id to a set of connected websockets
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        # Maps connection_id to report_id for lookup on disconnect
        self.connection_map: Dict[str, str] = {}
        # Queue of pending messages for reports without active connections
        self.pending_messages: Dict[str, List[dict]] = {}
    
    async def connect(self, websocket: WebSocket, report_id: str):
        connection_id = str(uuid.uuid4())
        await websocket.accept()
        
        if report_id not in self.active_connections:
            self.active_connections[report_id] = set()
        
        self.active_connections[report_id].add(websocket)
        self.connection_map[connection_id] = report_id
        
        logger.info(f"New connection {connection_id} for report {report_id}")
        
        # Send any pending messages for this report
        if report_id in self.pending_messages:
            for message in self.pending_messages[report_id]:
                try:
                    await websocket.send_json(message)
                    logger.info(f"Sent pending message for report {report_id}")
                except Exception as e:
                    logger.error(f"Failed to send pending message: {e}")
            
            # Clear the pending messages
            del self.pending_messages[report_id]
        
        # Return connection_id so it can be used to disconnect
        return connection_id
    
    async def disconnect(self, websocket: WebSocket, connection_id: str):
        if connection_id in self.connection_map:
            report_id = self.connection_map[connection_id]
            if report_id in self.active_connections:
                if websocket in self.active_connections[report_id]:
                    self.active_connections[report_id].remove(websocket)
                
                # Clean up empty sets
                if not self.active_connections[report_id]:
                    del self.active_connections[report_id]
            
            del self.connection_map[connection_id]
            logger.info(f"Connection {connection_id} for report {report_id} disconnected")
    
    async def send_update(self, report_id: str, data: dict):
        """Send update to all connected clients for a specific report"""
        logger.info(f"Attempting to send update for report {report_id}, event: {data.get('event')}")
        
        # If no connection exists yet, store the message for later delivery
        if report_id not in self.active_connections:
            logger.info(f"No active connections found for report {report_id}, queueing message")
            if report_id not in self.pending_messages:
                self.pending_messages[report_id] = []
            self.pending_messages[report_id].append(data)
            return
        
        # Check if we need to chunk the data (for completion events with large content)
        if data.get("event") == "completed" and "data" in data:
            await self.send_chunked_completion(report_id, data)
            return
            
        if report_id in self.active_connections:
            disconnected = set()
            connection_count = len(self.active_connections[report_id])
            logger.info(f"Found {connection_count} active connections for report {report_id}")
            
            for connection in self.active_connections[report_id]:
                try:
                    await connection.send_json(data)
                    logger.info(f"Successfully sent update to a connection for report {report_id}")
                except Exception as e:
                    logger.error(f"Error sending to websocket for report {report_id}: {str(e)}")
                    disconnected.add(connection)
            
            # Clean up any disconnected clients
            for conn in disconnected:
                for conn_id, rep_id in list(self.connection_map.items()):
                    if rep_id == report_id:
                        await self.disconnect(conn, conn_id)
        else:
            logger.warning(f"No active connections found for report {report_id}")

    async def send_chunked_completion(self, report_id: str, data: dict):
        """Send completion data in chunks to avoid WebSocket message size limitations"""
        if report_id not in self.active_connections:
            logger.warning(f"No active connections found for report {report_id}")
            return
        
        # Extract content data
        raw_content = data.get("data", {}).get("raw_content", "")
        processed_content = data.get("data", {}).get("processed_content", "")
        references = data.get("data", {}).get("references", {})
        
        # Define chunk size (adjust as needed)
        chunk_size = 50000  # ~50KB per chunk
        
        # First send a "completion_started" event to prepare the client
        start_message = {
            "event": "completion_chunks_started",
            "report_id": report_id,
            "message": "Starting to send completion data in chunks",
            "total_chunks": {
                "raw_content": max(1, (len(raw_content) + chunk_size - 1) // chunk_size),
                "processed_content": max(1, (len(processed_content) + chunk_size - 1) // chunk_size)
            }
        }
        
        # Send to all connections
        disconnected = set()
        for connection in self.active_connections[report_id]:
            try:
                await connection.send_json(start_message)
            except Exception as e:
                logger.error(f"Error sending to websocket for report {report_id}: {str(e)}")
                disconnected.add(connection)
        
        # Send raw content chunks
        await self.send_content_chunks(report_id, "raw_content", raw_content, chunk_size, disconnected)
        
        # Send processed content chunks
        await self.send_content_chunks(report_id, "processed_content", processed_content, chunk_size, disconnected)
        
        # Send references (usually smaller, can be sent in one go)
        references_message = {
            "event": "completion_chunk",
            "report_id": report_id,
            "chunk_type": "references",
            "chunk_index": 0,
            "total_chunks": 1,
            "data": references
        }
        
        for connection in self.active_connections[report_id]:
            if connection not in disconnected:
                try:
                    await connection.send_json(references_message)
                except Exception as e:
                    logger.error(f"Error sending references to websocket: {str(e)}")
                    disconnected.add(connection)
        
        # Send completion message
        completion_message = {
            "event": "completion_chunks_finished",
            "report_id": report_id,
            "message": "Report generation completed and all chunks sent"
        }
        
        for connection in self.active_connections[report_id]:
            if connection not in disconnected:
                try:
                    await connection.send_json(completion_message)
                    logger.info(f"Completed sending chunked data for report {report_id}")
                except Exception as e:
                    logger.error(f"Error sending completion message: {str(e)}")
                    disconnected.add(connection)
        
        # Clean up disconnected clients
        for conn in disconnected:
            for conn_id, rep_id in list(self.connection_map.items()):
                if rep_id == report_id:
                    await self.disconnect(conn, conn_id)

    async def send_content_chunks(self, report_id: str, content_type: str, content: str, chunk_size: int, disconnected: set):
        """Send content in chunks"""
        chunks = [content[i:i + chunk_size] for i in range(0, len(content), chunk_size)]
        total_chunks = len(chunks)
        
        for i, chunk in enumerate(chunks):
            chunk_message = {
                "event": "completion_chunk",
                "report_id": report_id,
                "chunk_type": content_type,
                "chunk_index": i,
                "total_chunks": total_chunks,
                "data": chunk
            }
            
            for connection in self.active_connections[report_id]:
                if connection not in disconnected:
                    try:
                        await connection.send_json(chunk_message)
                        logger.info(f"Sent {content_type} chunk {i+1}/{total_chunks} for report {report_id}")
                    except Exception as e:
                        logger.error(f"Error sending chunk to websocket: {str(e)}")
                        disconnected.add(connection)
                        
    # Add this to your ConnectionManager class
    async def cleanup_connections_for_report(self, report_id: str):
        """Remove all connections for a specific report"""
        if report_id in self.active_connections:
            # Get all connection IDs for this report
            connection_ids_to_remove = []
            for conn_id, rep_id in list(self.connection_map.items()):
                if rep_id == report_id:
                    connection_ids_to_remove.append(conn_id)
            
            # Close and remove all connections
            for connection in list(self.active_connections[report_id]):
                try:
                    await connection.close()
                    logger.info(f"Closed a connection for report {report_id}")
                except Exception as e:
                    logger.error(f"Error closing connection: {str(e)}")
            
            # Remove from connection map
            for conn_id in connection_ids_to_remove:
                if conn_id in self.connection_map:
                    del self.connection_map[conn_id]
            
            # Remove the report's entry
            if report_id in self.active_connections:
                del self.active_connections[report_id]
                
            logger.info(f"Cleaned up all connections for report {report_id}")